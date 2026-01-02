"""Get all steps use case."""

from src.domain.repositories import IStepRepository
from src.application.dtos import StepResponseDTO
from src.application.mappers import StepMapper


class GetAllSteps:
    """Use case for getting all steps."""

    def __init__(self, step_repository: IStepRepository):
        """Initialize use case.

        Args:
            step_repository: Repository for step persistence
        """
        self._repository = step_repository
        self._mapper = StepMapper()

    async def execute(self) -> list[StepResponseDTO]:
        """Get all steps.

        Returns:
            List of StepResponseDTO
        """
        steps = await self._repository.find_all()
        return [self._mapper.to_response_dto(step) for step in steps]
