"""Base repository interface."""

from abc import ABC, abstractmethod
from typing import Generic, TypeVar

from ..value_objects import EntityId

T = TypeVar("T")


class IRepository(ABC, Generic[T]):
    """Base repository interface for all entities.

    Provides standard CRUD operations.
    Concrete implementations handle persistence details.
    """

    @abstractmethod
    async def find_by_id(self, id: EntityId) -> T | None:
        """Find entity by ID.

        Args:
            id: Entity ID to find

        Returns:
            Entity if found, None otherwise
        """
        pass

    @abstractmethod
    async def find_all(self) -> list[T]:
        """Find all entities.

        Returns:
            List of all entities (may be empty)
        """
        pass

    @abstractmethod
    async def save(self, entity: T) -> None:
        """Save entity (create or update).

        Args:
            entity: Entity to save

        Note:
            Uses entity ID to determine if insert or update
        """
        pass

    @abstractmethod
    async def delete(self, id: EntityId) -> None:
        """Delete entity by ID.

        Args:
            id: Entity ID to delete

        Note:
            No error if entity doesn't exist
        """
        pass
