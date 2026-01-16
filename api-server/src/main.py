"""Application entry point."""

import logging
from contextlib import asynccontextmanager
from datetime import UTC, datetime

import uvicorn
from fastapi import FastAPI

from .container import Container
from .presentation.api.app import create_app
from .presentation.api.dependencies import auth as auth_dependencies
from .presentation.api.routers import (
    audit_logs as audit_logs_router,
)
from .presentation.api.routers import (
    categories as categories_router,
)
from .presentation.api.routers import (
    guides as guides_router,
)
from .presentation.api.routers import (
    sessions as sessions_router,
)
from .presentation.api.routers import (
    steps as steps_router,
)
from .presentation.api.routers import (
    users as users_router,
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan (startup/shutdown)."""
    # Startup: Connect to database
    container = app.state.container
    await container.database().connect()

    # Ensure coordination indexes exist
    coordinator = container.startup_coordinator()
    await coordinator.ensure_indexes()

    # Coordinate startup notification to prevent duplicates in Kubernetes
    config = container.config()
    deployment_id = config.deployment_id or datetime.now(UTC).isoformat()
    should_notify = await coordinator.should_send_startup_notification(deployment_id)

    if should_notify:
        telegram_service = container.telegram_notification_service()
        await telegram_service.send_startup_notification(app.version)
    else:
        logger.info(
            f"Skipping startup notification (already sent by another pod for "
            f"deployment: {deployment_id})"
        )

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

    # Inject container into routers and dependencies
    audit_logs_router.set_container(container)
    categories_router.set_container(container)
    guides_router.set_container(container)
    steps_router.set_container(container)
    sessions_router.set_container(container)
    users_router.set_container(container)
    auth_dependencies.set_container(container)

    return app


# Application instance for ASGI servers (uvicorn, gunicorn)
app = create_application()


def main():
    """Run the server with uvicorn."""
    uvicorn.run(app, host="0.0.0.0", port=8000)
