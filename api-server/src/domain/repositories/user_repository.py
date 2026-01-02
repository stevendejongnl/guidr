"""User repository interface."""

from abc import abstractmethod
from typing import Optional

from .base import IRepository
from ..entities import User
from ..value_objects import Email


class IUserRepository(IRepository[User]):
    """Repository interface for User entities."""

    @abstractmethod
    async def find_by_email(self, email: Email) -> Optional[User]:
        """Find user by email.

        Args:
            email: Email to search for

        Returns:
            User if found, None otherwise
        """
        pass
