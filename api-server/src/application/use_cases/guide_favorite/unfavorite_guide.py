"""Unfavorite guide use case."""

from src.domain.repositories import IGuideFavoriteRepository
from src.domain.value_objects import EntityId


class UnfavoriteGuide:
    """Use case for unfavoriting a guide.

    Idempotent: if the user hasn't favorited the guide, no-op.
    """

    def __init__(
        self,
        guide_favorite_repository: IGuideFavoriteRepository,
    ):
        """Initialize use case.

        Args:
            guide_favorite_repository: Repository for persistence
        """
        self._repository = guide_favorite_repository

    async def execute(
        self, user_id: str, guide_id: str
    ) -> None:
        """Unfavorite a guide for a user.

        Args:
            user_id: Current user ID
            guide_id: Guide ID to unfavorite
        """
        await self._repository.delete_by_user_and_guide(
            EntityId(user_id), EntityId(guide_id)
        )
