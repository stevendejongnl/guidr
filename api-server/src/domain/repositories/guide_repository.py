"""Guide repository interface."""

from abc import abstractmethod

from ..entities import Guide
from ..value_objects import EntityId, GuideType
from .base import IRepository


class IGuideRepository(IRepository[Guide]):
    """Repository interface for Guide entities."""

    @abstractmethod
    async def find_by_type(
        self, guide_type: GuideType
    ) -> list[Guide]:
        """Find guides by type.

        Args:
            guide_type: Guide type to filter by

        Returns:
            List of guides of given type (may be empty)
        """
        pass

    @abstractmethod
    async def find_by_user_id(
        self, user_id: EntityId
    ) -> list[Guide]:
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
    async def find_accessible_by_user(
        self, user_id: EntityId | None
    ) -> list[Guide]:
        """Find guides accessible by a user.

        Args:
            user_id: User ID (None for unauthenticated)

        Returns:
            List of accessible guides (may be empty)
        """
        pass
