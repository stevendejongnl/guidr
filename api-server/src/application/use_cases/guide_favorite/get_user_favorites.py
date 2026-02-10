"""Get user favorites use case."""

from src.domain.repositories import IGuideFavoriteRepository
from src.domain.value_objects import EntityId


class GetUserFavorites:
    """Use case for getting a user's favorited guide IDs."""

    def __init__(
        self,
        guide_favorite_repository: IGuideFavoriteRepository,
    ):
        """Initialize use case.

        Args:
            guide_favorite_repository: Repository for persistence
        """
        self._repository = guide_favorite_repository

    async def execute(self, user_id: str) -> list[str]:
        """Get all favorited guide IDs for a user.

        Args:
            user_id: Current user ID

        Returns:
            List of guide ID strings
        """
        favorites = await self._repository.find_by_user_id(
            EntityId(user_id)
        )
        return [f.guide_id.value for f in favorites]
