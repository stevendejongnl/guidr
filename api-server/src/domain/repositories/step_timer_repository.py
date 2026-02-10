"""Step timer repository interface."""

from abc import abstractmethod

from ..entities import StepTimer
from ..value_objects import EntityId
from .base import IRepository


class IStepTimerRepository(IRepository[StepTimer]):
    """Repository interface for StepTimer entities."""

    @abstractmethod
    async def find_by_step_and_user(
        self, step_id: EntityId, user_id: EntityId
    ) -> StepTimer | None:
        """Find a timer by step ID and user ID.

        Args:
            step_id: Step ID to filter by
            user_id: User ID to filter by

        Returns:
            StepTimer if found, None otherwise
        """
        pass

    @abstractmethod
    async def find_by_guide_and_user(
        self, guide_id: EntityId, user_id: EntityId
    ) -> list[StepTimer]:
        """Find all timers for a guide and user.

        Args:
            guide_id: Guide ID to filter by
            user_id: User ID to filter by

        Returns:
            List of timers (may be empty)
        """
        pass

    @abstractmethod
    async def delete_by_guide_and_user(
        self, guide_id: EntityId, user_id: EntityId
    ) -> None:
        """Delete all timers for a guide and user.

        Args:
            guide_id: Guide ID to filter by
            user_id: User ID to filter by
        """
        pass
