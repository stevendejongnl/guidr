"""Get sessions by guide use case."""

from src.domain.repositories import ISessionRepository
from src.domain.value_objects import EntityId
from src.application.dtos import SessionResponseDTO
from src.application.mappers import SessionMapper


class GetSessionsByGuide:
    """Use case for getting sessions by guide ID."""

    def __init__(self, session_repository: ISessionRepository):
        """Initialize use case.

        Args:
            session_repository: Repository for session persistence
        """
        self._repository = session_repository
        self._mapper = SessionMapper()

    async def execute(self, guide_id: str) -> list[SessionResponseDTO]:
        """Get sessions by guide ID.

        Args:
            guide_id: Guide ID

        Returns:
            List of SessionResponseDTO
        """
        sessions = await self._repository.find_by_guide_id(EntityId(guide_id))
        return [self._mapper.to_response_dto(session) for session in sessions]
