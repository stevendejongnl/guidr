"""Reset step timer use case."""

from src.application.dtos import StepTimerResponseDTO
from src.application.mappers import StepTimerMapper
from src.domain.exceptions import EntityNotFoundException
from src.domain.repositories import IStepTimerRepository
from src.domain.value_objects import EntityId


class ResetStepTimer:
    """Use case for resetting a step timer to idle."""

    def __init__(self, step_timer_repository: IStepTimerRepository):
        """Initialize use case.

        Args:
            step_timer_repository: Repository for timer persistence
        """
        self._repository = step_timer_repository
        self._mapper = StepTimerMapper()

    async def execute(self, timer_id: str) -> StepTimerResponseDTO:
        """Reset a timer to idle state.

        Args:
            timer_id: Timer ID to reset

        Returns:
            StepTimerResponseDTO with reset timer data

        Raises:
            EntityNotFoundException: If timer not found
        """
        timer = await self._repository.find_by_id(
            EntityId(timer_id)
        )
        if not timer:
            raise EntityNotFoundException(
                f"Timer not found: {timer_id}"
            )

        timer.reset()
        await self._repository.save(timer)
        return self._mapper.to_response_dto(timer)
