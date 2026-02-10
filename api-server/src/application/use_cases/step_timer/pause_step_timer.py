"""Pause step timer use case."""

from src.application.dtos import StepTimerResponseDTO
from src.application.mappers import StepTimerMapper
from src.domain.exceptions import EntityNotFoundException
from src.domain.repositories import IStepTimerRepository
from src.domain.value_objects import EntityId


class PauseStepTimer:
    """Use case for pausing a running step timer."""

    def __init__(self, step_timer_repository: IStepTimerRepository):
        """Initialize use case.

        Args:
            step_timer_repository: Repository for timer persistence
        """
        self._repository = step_timer_repository
        self._mapper = StepTimerMapper()

    async def execute(self, timer_id: str) -> StepTimerResponseDTO:
        """Pause a running timer.

        Args:
            timer_id: Timer ID to pause

        Returns:
            StepTimerResponseDTO with updated timer data

        Raises:
            EntityNotFoundException: If timer not found
            ValidationException: If timer is not running
        """
        timer = await self._repository.find_by_id(
            EntityId(timer_id)
        )
        if not timer:
            raise EntityNotFoundException(
                f"Timer not found: {timer_id}"
            )

        timer.pause()
        await self._repository.save(timer)
        return self._mapper.to_response_dto(timer)
