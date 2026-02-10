"""FastAPI application factory."""

import logging
import os
from importlib.metadata import PackageNotFoundError, version
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from .middleware import RequestLoggingMiddleware
from .routers import (
    audit_logs_router,
    config_router,
    guide_favorites_router,
    guides_router,
    sessions_router,
    step_timers_router,
    steps_router,
    system_router,
    users_router,
)


def _get_version() -> str:
    """Get package version.

    Resolution priority:
    1. GUIDR_VERSION environment variable (set during Docker build)
    2. Package metadata (from Poetry installation)
    3. Fallback: "0.0.0-dev"

    Returns:
        Package version string.
    """
    # Check environment variable first (production Docker)
    env_version = os.getenv("GUIDR_VERSION")
    if env_version:
        return env_version

    # Fall back to package metadata (local development)
    try:
        return version("guidr-api-server")
    except PackageNotFoundError:
        return "0.0.0-dev"


def create_app() -> FastAPI:
    """Create and configure FastAPI application.

    Returns:
        Configured FastAPI application
    """
    app = FastAPI(
        title="Guidr API",
        description="Step-by-step guide execution API",
        version=_get_version(),
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
    )

    # Custom OpenAPI schema to remove client credentials from OAuth2
    original_openapi = app.openapi

    def custom_openapi() -> dict:  # type: ignore[return]
        """Generate OpenAPI schema with OAuth2 password grant (no client credentials)."""
        if app.openapi_schema:
            return app.openapi_schema

        openapi_schema = original_openapi()

        # Customize OAuth2 password flow to hide client credentials
        if "components" in openapi_schema and "securitySchemes" in openapi_schema["components"]:
            for scheme_name, scheme in openapi_schema["components"]["securitySchemes"].items():
                if scheme.get("type") == "oauth2" and "password" in scheme.get("flows", {}):
                    # For password flow, remove clientId and clientSecret to hide them in Swagger UI
                    password_flow = scheme["flows"]["password"]
                    # Keep only tokenUrl and scopes
                    scheme["flows"]["password"] = {
                        "tokenUrl": password_flow.get("tokenUrl"),
                        "scopes": password_flow.get("scopes", {}),
                    }

        app.openapi_schema = openapi_schema
        return app.openapi_schema

    app.openapi = custom_openapi  # type: ignore[assignment]

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Configure appropriately for production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Request logging middleware (must be added after CORS)
    app.add_middleware(RequestLoggingMiddleware)

    # Global exception handler for unhandled exceptions
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        """Catch unhandled exceptions and send Telegram notification."""
        logger = logging.getLogger(__name__)
        logger.exception("Unhandled exception")

        # Send crash notification (non-blocking, don't fail if Telegram fails)
        try:
            container = request.app.state.container
            telegram_service = container.telegram_notification_service()
            pod_name = os.getenv("POD_NAME")
            await telegram_service.send_crash_notification(
                error=exc,
                version=request.app.version,
                pod_name=pod_name
            )
        except Exception as notification_error:
            logger.error(f"Failed to send crash notification: {notification_error}")

        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"}
        )

    # Register routers with /api/v1 prefix
    # IMPORTANT: Register API routers BEFORE catch-all to ensure correct routing precedence
    # FastAPI matches routes by specificity, so these explicit routes take priority over catch-all
    app.include_router(system_router, prefix="/api/v1")
    app.include_router(config_router, prefix="/api/v1")
    app.include_router(guides_router, prefix="/api/v1")
    app.include_router(steps_router, prefix="/api/v1")
    app.include_router(sessions_router, prefix="/api/v1")
    app.include_router(step_timers_router, prefix="/api/v1")
    app.include_router(guide_favorites_router, prefix="/api/v1")
    app.include_router(users_router, prefix="/api/v1")
    app.include_router(audit_logs_router, prefix="/api/v1")

    # Static files for web app (only if dist exists)
    web_app_dist = Path(__file__).parent.parent.parent.parent / "web-app" / "dist"
    if web_app_dist.exists() and web_app_dist.is_dir():
        # Mount static assets
        app.mount(
            "/assets",
            StaticFiles(directory=str(web_app_dist / "assets")),
            name="assets"
        )

        # SPA catch-all route - serves index.html for all non-API routes
        @app.get("/{full_path:path}", include_in_schema=False)
        async def serve_spa(full_path: str):
            """Serve SPA for all non-API routes."""
            logger = logging.getLogger(__name__)

            # Explicitly reject ALL API routes (defense in depth)
            # This should never be reached for API routes due to router precedence,
            # but provides a safety net if routing order changes
            if full_path.startswith("api/") or full_path.startswith("api"):
                logger.warning(f"Catch-all intercepted API route: /{full_path}")
                raise HTTPException(status_code=404, detail="API endpoint not found")

            logger.debug(f"Serving SPA for path: /{full_path}")
            index_file = web_app_dist / "index.html"
            if index_file.exists():
                return FileResponse(
                    index_file,
                    media_type="text/html",
                    headers={"X-Served-By": "SPA-Catch-All"}
                )
            raise HTTPException(status_code=404)

    return app
