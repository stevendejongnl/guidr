"""System API router."""

import logging
import os

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from src.container import Container

router = APIRouter(tags=["system"])
logger = logging.getLogger(__name__)


# Container (injected at app startup)
container: Container | None = None


def set_container(container_instance: Container) -> None:
    """Set the DI container for this router."""
    global container
    container = container_instance


@router.get("/health")
async def health_check(request: Request):
    """Health check endpoint with database connectivity verification."""
    logger.debug("Health check endpoint called")

    version = getattr(request.app, "version", "0.0.0-dev")

    # Get container from module-level (set during app startup or testing)
    # Fallback to request.app.state.container if module-level not set
    di_container = container or getattr(request.app.state, "container", None)
    if di_container is None:
        logger.error("Container not available")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "version": version,
                "database": "disconnected",
                "error": "Container not initialized"
            }
        )

    # Check database connectivity
    try:
        db = di_container.database().db

        # Simple ping to verify connection
        await db.command("ping")

        return {"status": "healthy", "version": version, "database": "connected"}
    except Exception as e:
        logger.error(f"Health check failed: {e}")

        # Send health failure notification (non-blocking)
        try:
            telegram_service = di_container.telegram_notification_service()
            pod_name = os.getenv("POD_NAME")
            await telegram_service.send_health_failure_notification(
                reason=f"Database connection failed: {type(e).__name__}",
                version=version,
                pod_name=pod_name
            )
        except Exception as notification_error:
            logger.error(f"Failed to send health failure notification: {notification_error}")

        # Return unhealthy status (triggers Kubernetes restart)
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "version": version,
                "database": "disconnected",
                "error": str(e)
            }
        )
