"""Get sessions by status use case."""

from src.domain.repositories import ISessionRepository
from src.domain.value_objects import SessionStatus
from src.application.dtos import SessionResponseDTO
from src.application.mappers import SessionMapper


class GetSessionsByStatus:
    """Use case for getting sessions by status."""

    def __init__(self, session_repository: ISessionRepository):
        """Initialize use case.

        Args:
            session_repository: Repository for session persistence
        """
        self._repository = session_repository
        self._mapper = SessionMapper()

    async def execute(self, status: str) -> list[SessionResponseDTO]:
        """Get sessions by status.

        Args:
            status: Session status (NotStarted, InProgress, Paused, Completed, Cancelled)

        Returns:
            List of SessionResponseDTO
        """
        session_status = SessionStatus(status)
        sessions = await self._repository.find_by_status(session_status)
        return [self._mapper.to_response_dto(session) for session in sessions]
