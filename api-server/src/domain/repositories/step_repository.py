"""Step repository interface."""

from abc import abstractmethod

from ..entities import Step
from ..value_objects import EntityId
from .base import IRepository


class IStepRepository(IRepository[Step]):
    """Repository interface for Step entities."""

    @abstractmethod
    async def find_by_guide_id(self, guide_id: EntityId) -> list[Step]:
        """Find steps by guide ID.

        Args:
            guide_id: Guide ID to filter by

        Returns:
            List of steps for given guide, ordered by order field (may be empty)
        """
        pass
