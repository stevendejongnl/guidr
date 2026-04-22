"""Application entry point."""

import logging
import os
from contextlib import asynccontextmanager
from datetime import UTC, datetime

import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import Response
from starlette.websockets import WebSocket

from .container import Container
from .infrastructure.migrations import MIGRATIONS, MigrationRunner
from .infrastructure.monitoring.sentry_config import init_sentry
from .presentation.api.app import create_app
from .presentation.api.dependencies import auth as auth_dependencies
from .presentation.api.routers import (
    audit_logs as audit_logs_router,
)
from .presentation.api.routers import (
    generation as generation_router,
)
from .presentation.api.routers import (
    guide_favorites as guide_favorites_router,
)
from .presentation.api.routers import (
    guides as guides_router,
)
from .presentation.api.routers import (
    sessions as sessions_router,
)
from .presentation.api.routers import (
    step_timers as step_timers_router,
)
from .presentation.api.routers import (
    steps as steps_router,
)
from .presentation.api.routers import (
    system as system_router,
)
from .presentation.api.routers import (
    users as users_router,
)
from .presentation.api.sse.sync_handler import sse_sync_endpoint
from .presentation.api.websocket.sync_handler import sync_endpoint

# Initialize Sentry (only if SENTRY_DSN is set in environment)
init_sentry()

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan (startup/shutdown)."""
    # Startup: Connect to database
    container = app.state.container
    await container.database().connect()

    # Run database migrations
    logger.info("Running database migrations...")
    db = container.database()
    migration_runner = MigrationRunner(db.db)
    await migration_runner.run_migrations(MIGRATIONS)

    # Ensure coordination indexes exist
    coordinator = container.startup_coordinator()
    await coordinator.ensure_indexes()

    # Coordinate startup notification to prevent duplicates in Kubernetes
    config = container.config()
    deployment_id = config.deployment_id or datetime.now(UTC).isoformat()
    pod_name = config.pod_name or os.getenv("POD_NAME")
    should_notify = await coordinator.should_send_startup_notification(deployment_id)

    if should_notify:
        telegram_service = container.telegram_notification_service()
        await telegram_service.send_startup_notification(app.version, pod_name=pod_name)
    else:
        logger.info(
            f"Skipping startup notification (already sent by another pod for "
            f"deployment: {deployment_id})"
        )

    shutdown_reason = "graceful"

    try:
        yield
    except Exception as e:
        # Track if shutdown is due to an error
        shutdown_reason = f"error: {type(e).__name__}"
        raise
    finally:
        # Shutdown: Send notification before disconnecting
        try:
            telegram_service = container.telegram_notification_service()
            await telegram_service.send_shutdown_notification(
                version=app.version,
                pod_name=pod_name,
                reason=shutdown_reason
            )
        except Exception as notification_error:
            logger.error(f"Failed to send shutdown notification: {notification_error}")

        # Disconnect from database
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

    # Wire WebSocket sync endpoint
    jwt_service = container.jwt_service()
    connection_manager = container.connection_manager()
    event_bus = container.event_bus()
    event_serializer = container.event_serializer()
    sse_manager = container.sse_manager()

    @app.websocket("/api/v1/ws/sync")
    async def ws_sync(websocket: WebSocket) -> None:
        await sync_endpoint(websocket, jwt_service, connection_manager)

    # Wire event bus → WebSocket broadcasting (legacy)
    async def broadcast_to_websocket(event):
        user_id = getattr(event, "user_id", "")
        if not user_id:
            return
        message = event_serializer.serialize(event)
        await connection_manager.broadcast_to_user(user_id, message)

    event_bus.subscribe(None, broadcast_to_websocket)

    # Wire event bus → SSE broadcasting
    async def broadcast_to_sse(event):
        user_id = getattr(event, "user_id", "")
        if not user_id:
            return
        message = event_serializer.serialize(event)
        await sse_manager.send_to_user(user_id, message)

    event_bus.subscribe(None, broadcast_to_sse)

    # Register SSE sync endpoint
    @app.get("/api/v1/sse/sync", include_in_schema=True, tags=["sse"])
    async def sse_sync(request: Request) -> Response:
        return await sse_sync_endpoint(request, jwt_service, sse_manager)

    # Inject container into routers and dependencies
    audit_logs_router.set_container(container)
    generation_router.set_container(container)
    guide_favorites_router.set_container(container)
    guides_router.set_container(container)
    steps_router.set_container(container)
    sessions_router.set_container(container)
    step_timers_router.set_container(container)
    system_router.set_container(container)
    users_router.set_container(container)
    auth_dependencies.set_container(container)

    return app


# Application instance for ASGI servers (uvicorn, gunicorn)
app = create_application()


def main():
    """Run the server with uvicorn."""
    uvicorn.run(app, host="0.0.0.0", port=8000)
