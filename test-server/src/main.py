"""Application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI

from .container import Container
from .presentation.api.app import create_app
from .presentation.api.routers import (
    categories as categories_router,
    guides as guides_router,
    steps as steps_router,
    sessions as sessions_router,
    users as users_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan (startup/shutdown)."""
    # Startup: Connect to database
    container = app.state.container
    await container.database().connect()
    yield
    # Shutdown: Disconnect from database
    await container.database().disconnect()


def create_application() -> FastAPI:
    """Create and configure the FastAPI application.

    Returns:
        Configured FastAPI application with DI container
    """
    # Create container
    container = Container()

    # Create FastAPI app
    app = create_app()

    # Store container in app state
    app.state.container = container

    # Replace lifespan
    app.router.lifespan_context = lifespan

    # Inject container into routers
    categories_router.set_container(container)
    guides_router.set_container(container)
    steps_router.set_container(container)
    sessions_router.set_container(container)
    users_router.set_container(container)

    return app


# Application instance for ASGI servers (uvicorn, gunicorn)
app = create_application()
