"""Session repository interface."""

from abc import abstractmethod

from ..entities import Session
from ..value_objects import EntityId, SessionStatus
from .base import IRepository


class ISessionRepository(IRepository[Session]):
    """Repository interface for Session entities."""

    @abstractmethod
    async def find_by_guide_id(self, guide_id: EntityId) -> list[Session]:
        """Find sessions by guide ID.

        Args:
            guide_id: Guide ID to filter by

        Returns:
            List of sessions for given guide (may be empty)
        """
        pass

    @abstractmethod
    async def find_by_status(self, status: SessionStatus) -> list[Session]:
        """Find sessions by status.

        Args:
            status: Status to filter by

        Returns:
            List of sessions with given status (may be empty)
        """
        pass
