"""Get active timers across all guides for a user."""

from src.application.dtos import ActiveStepTimerResponseDTO
from src.application.mappers import StepTimerMapper
from src.domain.repositories import (
    IGuideRepository,
    IStepRepository,
    IStepTimerRepository,
)
from src.domain.value_objects import EntityId


class GetActiveTimers:
    """Use case for getting all active timers for a user."""

    def __init__(
        self,
        step_timer_repository: IStepTimerRepository,
        guide_repository: IGuideRepository,
        step_repository: IStepRepository,
    ):
        """Initialize use case.

        Args:
            step_timer_repository: Repository for timer persistence
            guide_repository: Repository for guide lookup
            step_repository: Repository for step lookup
        """
        self._timer_repo = step_timer_repository
        self._guide_repo = guide_repository
        self._step_repo = step_repository
        self._mapper = StepTimerMapper()

    async def execute(
        self, user_id: str
    ) -> list[ActiveStepTimerResponseDTO]:
        """Get all active timers enriched with titles.

        Args:
            user_id: User ID to filter by

        Returns:
            List of ActiveStepTimerResponseDTOs
        """
        timers = await self._timer_repo.find_active_by_user(
            EntityId(user_id)
        )
        if not timers:
            return []

        # Batch-fetch guides and steps by unique IDs
        guide_ids = {t.guide_id for t in timers}
        step_ids = {t.step_id for t in timers}

        guide_map: dict[str, str] = {}
        for gid in guide_ids:
            guide = await self._guide_repo.find_by_id(gid)
            if guide:
                guide_map[gid.value] = guide.title.value

        step_map: dict[str, str] = {}
        for sid in step_ids:
            step = await self._step_repo.find_by_id(sid)
            if step:
                step_map[sid.value] = step.title

        result: list[ActiveStepTimerResponseDTO] = []
        for timer in timers:
            base = self._mapper.to_response_dto(timer)
            result.append(
                ActiveStepTimerResponseDTO(
                    id=base.id,
                    step_id=base.step_id,
                    guide_id=base.guide_id,
                    user_id=base.user_id,
                    status=base.status,
                    started_at=base.started_at,
                    accumulated_seconds=base.accumulated_seconds,
                    duration_seconds=base.duration_seconds,
                    created_at=base.created_at,
                    updated_at=base.updated_at,
                    guide_title=guide_map.get(
                        timer.guide_id.value, "Unknown"
                    ),
                    step_title=step_map.get(
                        timer.step_id.value, "Unknown"
                    ),
                )
            )

        return result
