"""Get step timers by guide use case."""

from src.application.dtos import StepTimerResponseDTO
from src.application.mappers import StepTimerMapper
from src.domain.repositories import IStepTimerRepository
from src.domain.value_objects import EntityId


class GetStepTimersByGuide:
    """Use case for getting all timers for a guide and user."""

    def __init__(self, step_timer_repository: IStepTimerRepository):
        """Initialize use case.

        Args:
            step_timer_repository: Repository for timer persistence
        """
        self._repository = step_timer_repository
        self._mapper = StepTimerMapper()

    async def execute(
        self, guide_id: str, user_id: str
    ) -> list[StepTimerResponseDTO]:
        """Get all timers for a guide and user.

        Args:
            guide_id: Guide ID to filter by
            user_id: User ID to filter by

        Returns:
            List of StepTimerResponseDTOs
        """
        timers = await self._repository.find_by_guide_and_user(
            EntityId(guide_id), EntityId(user_id)
        )
        return [
            self._mapper.to_response_dto(timer) for timer in timers
        ]
