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
