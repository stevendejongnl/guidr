"""Session mapper for entity-DTO conversion."""

from src.application.dtos import SessionResponseDTO
from src.domain.entities import Session


class SessionMapper:
    """Mapper for Session entity to DTOs."""

    @staticmethod
    def to_response_dto(session: Session) -> SessionResponseDTO:
        """Convert Session entity to SessionResponseDTO.

        Args:
            session: Session entity

        Returns:
            SessionResponseDTO with all session data
        """
        return SessionResponseDTO(
            id=session.id.value,
            guide_id=session.guide_id.value,
            status=session.status.value,
            started_at=session.started_at.isoformat() if session.started_at else None,
            completed_at=session.completed_at.isoformat()
            if session.completed_at
            else None,
            current_step_id=session.current_step_id.value
            if session.current_step_id
            else None,
            step_elapsed_seconds=session.step_elapsed_seconds,
            created_at=session.created_at.isoformat(),
            updated_at=session.updated_at.isoformat(),
        )
