"""Get all sessions use case."""

from src.domain.repositories import ISessionRepository
from src.application.dtos import SessionResponseDTO
from src.application.mappers import SessionMapper


class GetAllSessions:
    """Use case for getting all sessions."""

    def __init__(self, session_repository: ISessionRepository):
        """Initialize use case.

        Args:
            session_repository: Repository for session persistence
        """
        self._repository = session_repository
        self._mapper = SessionMapper()

    async def execute(self) -> list[SessionResponseDTO]:
        """Get all sessions.

        Returns:
            List of SessionResponseDTO
        """
        sessions = await self._repository.find_all()
        return [self._mapper.to_response_dto(session) for session in sessions]
