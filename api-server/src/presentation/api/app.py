"""FastAPI application factory."""

from importlib.metadata import PackageNotFoundError, version

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import (
    categories_router,
    config_router,
    guides_router,
    sessions_router,
    steps_router,
    system_router,
    users_router,
)


def _get_version() -> str:
    """Get package version from metadata.

    Returns:
        Package version string, or "0.0.0-dev" if not installed.
    """
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

    # Register routers with /api/v1 prefix
    app.include_router(system_router, prefix="/api/v1")
    app.include_router(config_router, prefix="/api/v1")
    app.include_router(categories_router, prefix="/api/v1")
    app.include_router(guides_router, prefix="/api/v1")
    app.include_router(steps_router, prefix="/api/v1")
    app.include_router(sessions_router, prefix="/api/v1")
    app.include_router(users_router, prefix="/api/v1")

    return app
