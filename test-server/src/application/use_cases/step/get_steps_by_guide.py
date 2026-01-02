"""Get steps by guide use case."""

from src.domain.repositories import IStepRepository
from src.domain.value_objects import EntityId
from src.application.dtos import StepResponseDTO
from src.application.mappers import StepMapper


class GetStepsByGuide:
    """Use case for getting steps by guide ID."""

    def __init__(self, step_repository: IStepRepository):
        """Initialize use case.

        Args:
            step_repository: Repository for step persistence
        """
        self._repository = step_repository
        self._mapper = StepMapper()

    async def execute(self, guide_id: str) -> list[StepResponseDTO]:
        """Get steps by guide ID, ordered by order field.

        Args:
            guide_id: Guide ID

        Returns:
            List of StepResponseDTO ordered by order field
        """
        steps = await self._repository.find_by_guide_id(EntityId(guide_id))
        return [self._mapper.to_response_dto(step) for step in steps]
