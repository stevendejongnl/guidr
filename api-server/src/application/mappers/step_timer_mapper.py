"""Step timer mapper for entity-DTO conversion."""

from datetime import UTC, datetime

from src.application.dtos import StepTimerResponseDTO
from src.domain.entities import StepTimer


class StepTimerMapper:
    """Mapper for StepTimer entity to DTOs."""

    @staticmethod
    def to_response_dto(timer: StepTimer) -> StepTimerResponseDTO:
        """Convert StepTimer entity to StepTimerResponseDTO.

        Args:
            timer: StepTimer entity

        Returns:
            StepTimerResponseDTO with all timer data
        """
        return StepTimerResponseDTO(
            id=timer.id.value,
            step_id=timer.step_id.value,
            guide_id=timer.guide_id.value,
            user_id=timer.user_id.value,
            status=timer.status.value,
            started_at=(
                timer.started_at.replace(tzinfo=UTC).isoformat()
                if timer.started_at and timer.started_at.tzinfo is None
                else (
                    timer.started_at.isoformat()
                    if timer.started_at
                    else None
                )
            ),
            accumulated_seconds=timer.accumulated_seconds,
            duration_seconds=timer.duration_seconds,
            created_at=timer.created_at.isoformat(),
            updated_at=timer.updated_at.isoformat(),
            server_time=datetime.now(UTC).isoformat(),
        )
