"""Pause session use case."""

from src.application.dtos import SessionResponseDTO
from src.application.mappers import SessionMapper
from src.domain.exceptions import EntityNotFoundException
from src.domain.repositories import ISessionRepository
from src.domain.value_objects import EntityId


class PauseSession:
    """Use case for pausing a session."""

    def __init__(self, session_repository: ISessionRepository):
        """Initialize use case.

        Args:
            session_repository: Repository for session persistence
        """
        self._repository = session_repository
        self._mapper = SessionMapper()

    async def execute(
        self, session_id: str, step_elapsed_seconds: int | None = None
    ) -> SessionResponseDTO:
        """Pause a session.

        Args:
            session_id: Session ID
            step_elapsed_seconds: Optional elapsed seconds to save for current step

        Returns:
            SessionResponseDTO with updated session data

        Raises:
            EntityNotFoundException: If session not found
            ValidationException: If session cannot be paused
        """
        # Find existing session
        session = await self._repository.find_by_id(EntityId(session_id))
        if not session:
            raise EntityNotFoundException(f"Session not found: {session_id}")

        # Set elapsed seconds if provided
        if step_elapsed_seconds is not None:
            session.set_step_elapsed_seconds(step_elapsed_seconds)

        # Pause session
        session.pause()

        # Save and return
        await self._repository.save(session)
        return self._mapper.to_response_dto(session)
