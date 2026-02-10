"""Start step timer use case."""

from uuid import uuid4

from src.application.dtos import StepTimerResponseDTO
from src.application.mappers import StepTimerMapper
from src.domain.entities import StepTimer
from src.domain.repositories import IStepTimerRepository
from src.domain.value_objects import EntityId


class StartStepTimer:
    """Use case for starting or resuming a step timer."""

    def __init__(self, step_timer_repository: IStepTimerRepository):
        """Initialize use case.

        Args:
            step_timer_repository: Repository for timer persistence
        """
        self._repository = step_timer_repository
        self._mapper = StepTimerMapper()

    async def execute(
        self,
        step_id: str,
        guide_id: str,
        duration_seconds: int,
        user_id: str,
    ) -> StepTimerResponseDTO:
        """Start or resume a step timer.

        Creates a new timer if one doesn't exist for the step+user.
        Resumes if paused, returns as-is if already running.

        Args:
            step_id: Step ID
            guide_id: Guide ID
            duration_seconds: Duration in seconds (0 = stopwatch)
            user_id: Current user ID

        Returns:
            StepTimerResponseDTO with timer data
        """
        step_entity_id = EntityId(step_id)
        user_entity_id = EntityId(user_id)

        # Look up existing timer
        existing = await self._repository.find_by_step_and_user(
            step_entity_id, user_entity_id
        )

        if existing:
            if existing.status.value == "running":
                return self._mapper.to_response_dto(existing)
            existing.start()
            await self._repository.save(existing)
            return self._mapper.to_response_dto(existing)

        # Create new timer
        timer = StepTimer(
            id=EntityId(str(uuid4())),
            step_id=step_entity_id,
            guide_id=EntityId(guide_id),
            user_id=user_entity_id,
            duration_seconds=duration_seconds,
        )
        timer.start()
        await self._repository.save(timer)
        return self._mapper.to_response_dto(timer)
