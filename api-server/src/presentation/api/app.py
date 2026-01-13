"""FastAPI application factory."""

import os
from importlib.metadata import PackageNotFoundError, version
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .middleware import RequestLoggingMiddleware
from .routers import (
    audit_logs_router,
    categories_router,
    config_router,
    guides_router,
    sessions_router,
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

    # Register routers with /api/v1 prefix
    app.include_router(system_router, prefix="/api/v1")
    app.include_router(config_router, prefix="/api/v1")
    app.include_router(categories_router, prefix="/api/v1")
    app.include_router(guides_router, prefix="/api/v1")
    app.include_router(steps_router, prefix="/api/v1")
    app.include_router(sessions_router, prefix="/api/v1")
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
        @app.get("/{full_path:path}")
        async def serve_spa(full_path: str):
            """Serve SPA for all non-API routes."""
            # Don't catch API routes (should never be reached due to router precedence)
            if full_path.startswith("api/"):
                raise HTTPException(status_code=404)

            index_file = web_app_dist / "index.html"
            if index_file.exists():
                return FileResponse(index_file)
            raise HTTPException(status_code=404)

    return app
