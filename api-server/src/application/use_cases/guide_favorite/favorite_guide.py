"""Favorite guide use case."""

from uuid import uuid4

from src.domain.entities import GuideFavorite
from src.domain.repositories import IGuideFavoriteRepository
from src.domain.value_objects import EntityId


class FavoriteGuide:
    """Use case for favoriting a guide.

    Idempotent: if the user already favorited the guide, no-op.
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
        """Favorite a guide for a user.

        Args:
            user_id: Current user ID
            guide_id: Guide ID to favorite
        """
        user_entity_id = EntityId(user_id)
        guide_entity_id = EntityId(guide_id)

        # Check if already favorited (idempotent)
        existing = await self._repository.find_by_user_and_guide(
            user_entity_id, guide_entity_id
        )
        if existing:
            return

        favorite = GuideFavorite(
            id=EntityId(str(uuid4())),
            user_id=user_entity_id,
            guide_id=guide_entity_id,
        )
        await self._repository.save(favorite)
