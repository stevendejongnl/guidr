"""Category domain entity."""

from datetime import datetime
from typing import Optional

from ..value_objects import EntityId
from ..exceptions import ValidationException


class Category:
    """Category entity for organizing guides hierarchically."""

    def __init__(
        self,
        id: EntityId,
        name: str,
        parent_id: Optional[EntityId] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
    ):
        """Initialize a Category.

        Args:
            id: Unique identifier
            name: Category name (non-empty)
            parent_id: Optional parent category ID for hierarchy
            created_at: Optional creation timestamp (defaults to now)
            updated_at: Optional update timestamp (defaults to now)

        Raises:
            ValidationException: If name is empty or blank
        """
        if not name or not name.strip():
            raise ValidationException("Category name cannot be empty")

        self._id = id
        self._name = name
        self._parent_id = parent_id
        self._created_at = created_at or datetime.utcnow()
        self._updated_at = updated_at or datetime.utcnow()

    @property
    def id(self) -> EntityId:
        """Get entity ID."""
        return self._id

    @property
    def name(self) -> str:
        """Get category name."""
        return self._name

    @property
    def parent_id(self) -> Optional[EntityId]:
        """Get parent category ID."""
        return self._parent_id

    @property
    def created_at(self) -> datetime:
        """Get creation timestamp."""
        return self._created_at

    @property
    def updated_at(self) -> datetime:
        """Get last update timestamp."""
        return self._updated_at

    def update_name(self, new_name: str) -> None:
        """Update category name.

        Args:
            new_name: New name (non-empty)

        Raises:
            ValidationException: If new_name is empty or blank
        """
        if not new_name or not new_name.strip():
            raise ValidationException("Category name cannot be empty")

        self._name = new_name
        self._updated_at = datetime.utcnow()

    def is_root(self) -> bool:
        """Check if this is a root category (no parent).

        Returns:
            True if parent_id is None, False otherwise
        """
        return self._parent_id is None
