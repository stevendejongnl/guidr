"""Delete session use case."""

from src.domain.repositories import ISessionRepository
from src.domain.value_objects import EntityId


class DeleteSession:
    """Use case for deleting a session."""

    def __init__(self, session_repository: ISessionRepository):
        """Initialize use case.

        Args:
            session_repository: Repository for session persistence
        """
        self._repository = session_repository

    async def execute(self, session_id: str) -> None:
        """Delete a session.

        Args:
            session_id: Session ID
        """
        await self._repository.delete(EntityId(session_id))
