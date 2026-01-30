"""Guide repository interface."""

from abc import abstractmethod

from ..entities import Guide
from ..value_objects import EntityId
from .base import IRepository


class IGuideRepository(IRepository[Guide]):
    """Repository interface for Guide entities."""

    @abstractmethod
    async def find_by_category_id(self, category_id: EntityId) -> list[Guide]:
        """Find guides by category ID.

        Args:
            category_id: Category ID to filter by

        Returns:
            List of guides in given category (may be empty)
        """
        pass

    @abstractmethod
    async def find_by_user_id(self, user_id: EntityId) -> list[Guide]:
        """Find all guides created by a specific user.

        Args:
            user_id: User ID to filter by

        Returns:
            List of guides created by user (may be empty)
        """
        pass

    @abstractmethod
    async def find_public_guides(self) -> list[Guide]:
        """Find all public guides.

        Returns:
            List of public guides (may be empty)
        """
        pass

    @abstractmethod
    async def find_highlighted_guides(self) -> list[Guide]:
        """Find all highlighted guides (for homepage).

        Returns:
            List of highlighted guides (may be empty)
        """
        pass

    @abstractmethod
    async def find_accessible_by_user(self, user_id: EntityId | None) -> list[Guide]:
        """Find guides accessible by a user (public + user's own guides).

        Args:
            user_id: User ID (None for unauthenticated)

        Returns:
            List of accessible guides (may be empty)
        """
        pass
