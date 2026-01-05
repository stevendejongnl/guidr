"""Config API router."""

from fastapi import APIRouter, Depends

from src.infrastructure.config import Settings, get_settings

from ..models import ConfigResponse

router = APIRouter(tags=["config"])


@router.get("/config", response_model=ConfigResponse)
async def get_config(settings: Settings = Depends(get_settings)) -> ConfigResponse:
    """Get server configuration.

    Returns:
        Server configuration including debug mode and version constraints
    """
    return ConfigResponse(
        debugMode=settings.debug_mode,
        minAppVersion=settings.min_app_version,
        maxAppVersion=settings.max_app_version,
    )
