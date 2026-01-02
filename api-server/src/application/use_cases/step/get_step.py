"""Get step use case."""

from typing import Optional

from src.domain.repositories import IStepRepository
from src.domain.value_objects import EntityId
from src.application.dtos import StepResponseDTO
from src.application.mappers import StepMapper


class GetStep:
    """Use case for getting a step by ID."""

    def __init__(self, step_repository: IStepRepository):
        """Initialize use case.

        Args:
            step_repository: Repository for step persistence
        """
        self._repository = step_repository
        self._mapper = StepMapper()

    async def execute(self, step_id: str) -> Optional[StepResponseDTO]:
        """Get a step by ID.

        Args:
            step_id: Step ID

        Returns:
            StepResponseDTO if found, None otherwise
        """
        step = await self._repository.find_by_id(EntityId(step_id))
        if not step:
            return None
        return self._mapper.to_response_dto(step)
