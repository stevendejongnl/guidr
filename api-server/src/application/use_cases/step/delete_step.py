"""Delete step use case."""

from src.domain.repositories import IStepRepository
from src.domain.value_objects import EntityId


class DeleteStep:
    """Use case for deleting a step."""

    def __init__(self, step_repository: IStepRepository):
        """Initialize use case.

        Args:
            step_repository: Repository for step persistence
        """
        self._repository = step_repository

    async def execute(self, step_id: str) -> None:
        """Delete a step.

        Args:
            step_id: Step ID
        """
        await self._repository.delete(EntityId(step_id))
