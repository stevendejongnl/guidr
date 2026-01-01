"""Category repository interface."""

from abc import abstractmethod
from typing import Optional

from .base import IRepository
from ..entities import Category
from ..value_objects import EntityId


class ICategoryRepository(IRepository[Category]):
    """Repository interface for Category entities."""

    @abstractmethod
    async def find_by_parent_id(self, parent_id: Optional[EntityId]) -> list[Category]:
        """Find categories by parent ID.

        Args:
            parent_id: Parent category ID (None for root categories)

        Returns:
            List of categories with given parent (may be empty)
        """
        pass
