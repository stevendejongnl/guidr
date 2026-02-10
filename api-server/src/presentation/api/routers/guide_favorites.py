"""Guide favorites API router."""

from fastapi import APIRouter, Depends, status

from src.application.use_cases.guide_favorite import (
    FavoriteGuide,
    GetUserFavorites,
    UnfavoriteGuide,
)
from src.container import Container
from src.domain.entities import User

from ..dependencies.auth import get_current_user
from ..models.guide_favorite_models import GuideFavoriteListResponse

router = APIRouter(
    prefix="/guide-favorites", tags=["guide-favorites"]
)


# Container (injected at app startup)
_container: Container | None = None


def set_container(container: Container) -> None:
    """Set the DI container for this router."""
    global _container
    _container = container


# Dependency providers
def get_favorite_guide_use_case() -> FavoriteGuide:
    assert _container is not None, "Container not initialized"
    return _container.favorite_guide_use_case()


def get_unfavorite_guide_use_case() -> UnfavoriteGuide:
    assert _container is not None, "Container not initialized"
    return _container.unfavorite_guide_use_case()


def get_get_user_favorites_use_case() -> GetUserFavorites:
    assert _container is not None, "Container not initialized"
    return _container.get_user_favorites_use_case()


@router.post(
    "/guides/{guide_id}",
    status_code=status.HTTP_201_CREATED,
)
async def favorite_guide(
    guide_id: str,
    current_user: User = Depends(get_current_user),
    use_case: FavoriteGuide = Depends(
        get_favorite_guide_use_case
    ),
) -> None:
    """Favorite a guide for the current user."""
    await use_case.execute(
        user_id=current_user.id.value,
        guide_id=guide_id,
    )


@router.delete(
    "/guides/{guide_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def unfavorite_guide(
    guide_id: str,
    current_user: User = Depends(get_current_user),
    use_case: UnfavoriteGuide = Depends(
        get_unfavorite_guide_use_case
    ),
) -> None:
    """Unfavorite a guide for the current user."""
    await use_case.execute(
        user_id=current_user.id.value,
        guide_id=guide_id,
    )


@router.get(
    "",
    response_model=GuideFavoriteListResponse,
)
async def get_user_favorites(
    current_user: User = Depends(get_current_user),
    use_case: GetUserFavorites = Depends(
        get_get_user_favorites_use_case
    ),
) -> GuideFavoriteListResponse:
    """Get all favorited guide IDs for the current user."""
    guide_ids = await use_case.execute(
        user_id=current_user.id.value,
    )
    return GuideFavoriteListResponse(guideIds=guide_ids)
