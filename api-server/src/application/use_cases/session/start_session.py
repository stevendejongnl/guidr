"""Start session use case."""

from src.domain.repositories import ISessionRepository
from src.domain.value_objects import EntityId
from src.domain.exceptions import EntityNotFoundException
from src.application.dtos import SessionResponseDTO
from src.application.mappers import SessionMapper


class StartSession:
    """Use case for starting a session."""

    def __init__(self, session_repository: ISessionRepository):
        """Initialize use case.

        Args:
            session_repository: Repository for session persistence
        """
        self._repository = session_repository
        self._mapper = SessionMapper()

    async def execute(self, session_id: str) -> SessionResponseDTO:
        """Start a session.

        Args:
            session_id: Session ID

        Returns:
            SessionResponseDTO with updated session data

        Raises:
            EntityNotFoundException: If session not found
            ValidationException: If session cannot be started
        """
        # Find existing session
        session = await self._repository.find_by_id(EntityId(session_id))
        if not session:
            raise EntityNotFoundException(f"Session not found: {session_id}")

        # Start session
        session.start()

        # Save and return
        await self._repository.save(session)
        return self._mapper.to_response_dto(session)
