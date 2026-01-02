"""Get session use case."""

from typing import Optional

from src.domain.repositories import ISessionRepository
from src.domain.value_objects import EntityId
from src.application.dtos import SessionResponseDTO
from src.application.mappers import SessionMapper


class GetSession:
    """Use case for getting a session by ID."""

    def __init__(self, session_repository: ISessionRepository):
        """Initialize use case.

        Args:
            session_repository: Repository for session persistence
        """
        self._repository = session_repository
        self._mapper = SessionMapper()

    async def execute(self, session_id: str) -> Optional[SessionResponseDTO]:
        """Get a session by ID.

        Args:
            session_id: Session ID

        Returns:
            SessionResponseDTO if found, None otherwise
        """
        session = await self._repository.find_by_id(EntityId(session_id))
        if not session:
            return None
        return self._mapper.to_response_dto(session)
