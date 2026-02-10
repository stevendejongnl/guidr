"""Guide favorite repository interface."""

from abc import abstractmethod

from ..entities import GuideFavorite
from ..value_objects import EntityId
from .base import IRepository


class IGuideFavoriteRepository(IRepository[GuideFavorite]):
    """Repository interface for GuideFavorite entities."""

    @abstractmethod
    async def find_by_user_id(
        self, user_id: EntityId
    ) -> list[GuideFavorite]:
        """Find all favorites for a user.

        Args:
            user_id: User ID to filter by

        Returns:
            List of favorites (may be empty)
        """
        pass

    @abstractmethod
    async def find_by_user_and_guide(
        self, user_id: EntityId, guide_id: EntityId
    ) -> GuideFavorite | None:
        """Find a favorite by user ID and guide ID.

        Args:
            user_id: User ID to filter by
            guide_id: Guide ID to filter by

        Returns:
            GuideFavorite if found, None otherwise
        """
        pass

    @abstractmethod
    async def delete_by_user_and_guide(
        self, user_id: EntityId, guide_id: EntityId
    ) -> None:
        """Delete a favorite by user ID and guide ID.

        Args:
            user_id: User ID to filter by
            guide_id: Guide ID to filter by
        """
        pass
