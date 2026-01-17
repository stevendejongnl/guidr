"""System API router."""

import logging
import os

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

router = APIRouter(tags=["system"])
logger = logging.getLogger(__name__)


@router.get("/health")
async def health_check(request: Request):
    """Health check endpoint with database connectivity verification."""
    logger.debug("Health check endpoint called")

    version = getattr(request.app, "version", "0.0.0-dev")

    # Check database connectivity
    try:
        container = request.app.state.container
        db = container.database().db

        # Simple ping to verify connection
        await db.command("ping")

        return {"status": "healthy", "version": version, "database": "connected"}
    except Exception as e:
        logger.error(f"Health check failed: {e}")

        # Send health failure notification (non-blocking)
        try:
            telegram_service = container.telegram_notification_service()
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
