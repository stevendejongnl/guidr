"""Config API router."""

from fastapi import APIRouter, Depends

from src.infrastructure.config import get_settings, Settings
from ..models import ConfigResponse

router = APIRouter(tags=["config"])


@router.get("/config", response_model=ConfigResponse)
async def get_config(settings: Settings = Depends(get_settings)) -> ConfigResponse:
    """Get server configuration.

    Returns:
        Server configuration including debug mode and version constraints
    """
    return ConfigResponse(
        debug_mode=settings.debug_mode,
        min_app_version=settings.min_app_version,
        max_app_version=settings.max_app_version,
    )
