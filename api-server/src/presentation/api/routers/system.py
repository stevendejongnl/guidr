"""System API router."""

from fastapi import APIRouter, Request

router = APIRouter(tags=["system"])


@router.get("/health")
async def health_check(request: Request):
    """Health check endpoint."""
    import logging
    logger = logging.getLogger(__name__)
    logger.debug("Health check endpoint called")

    # Get version from app
    version = getattr(request.app, "version", "0.0.0-dev")

    return {"status": "healthy", "version": version}
