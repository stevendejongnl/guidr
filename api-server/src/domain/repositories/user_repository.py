"""User repository interface."""

from abc import abstractmethod

from ..entities import User
from ..value_objects import Email
from .base import IRepository


class IUserRepository(IRepository[User]):
    """Repository interface for User entities."""

    @abstractmethod
    async def find_by_email(self, email: Email) -> User | None:
        """Find user by email.

        Args:
            email: Email to search for

        Returns:
            User if found, None otherwise
        """
        pass
