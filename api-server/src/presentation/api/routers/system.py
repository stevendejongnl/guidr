"""System API router."""

from fastapi import APIRouter

router = APIRouter(tags=["system"])


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    import logging
    logger = logging.getLogger(__name__)
    logger.debug("Health check endpoint called")
    return {"status": "healthy"}
