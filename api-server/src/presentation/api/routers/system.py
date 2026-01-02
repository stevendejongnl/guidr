"""System API router."""

from fastapi import APIRouter

router = APIRouter(tags=["system"])


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
