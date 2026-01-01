"""Step domain entity."""

from datetime import datetime
from typing import Optional

from ..value_objects import EntityId, StepDuration
from ..exceptions import ValidationException


class Step:
    """Step entity representing a single step in a guide."""

    def __init__(
        self,
        id: EntityId,
        guide_id: EntityId,
        order: int,
        title: str,
        duration: StepDuration,
        description: Optional[str] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
    ):
        """Initialize a Step.

        Args:
            id: Unique identifier
            guide_id: Parent guide ID
            order: Step order (non-negative)
            title: Step title (non-empty)
            duration: Step duration in seconds (positive)
            description: Optional description
            created_at: Optional creation timestamp (defaults to now)
            updated_at: Optional update timestamp (defaults to now)

        Raises:
            ValidationException: If title is empty or order is negative
        """
        if not title or not title.strip():
            raise ValidationException("Step title cannot be empty")
        if order < 0:
            raise ValidationException("Step order must be non-negative")

        self._id = id
        self._guide_id = guide_id
        self._order = order
        self._title = title
        self._duration = duration
        self._description = description
        self._created_at = created_at or datetime.utcnow()
        self._updated_at = updated_at or datetime.utcnow()

    @property
    def id(self) -> EntityId:
        """Get entity ID."""
        return self._id

    @property
    def guide_id(self) -> EntityId:
        """Get guide ID."""
        return self._guide_id

    @property
    def order(self) -> int:
        """Get step order."""
        return self._order

    @property
    def title(self) -> str:
        """Get step title."""
        return self._title

    @property
    def duration(self) -> StepDuration:
        """Get step duration."""
        return self._duration

    @property
    def description(self) -> Optional[str]:
        """Get step description."""
        return self._description

    @property
    def created_at(self) -> datetime:
        """Get creation timestamp."""
        return self._created_at

    @property
    def updated_at(self) -> datetime:
        """Get last update timestamp."""
        return self._updated_at

    def update_title(self, new_title: str) -> None:
        """Update step title.

        Args:
            new_title: New title (non-empty)

        Raises:
            ValidationException: If new_title is empty or blank
        """
        if not new_title or not new_title.strip():
            raise ValidationException("Step title cannot be empty")

        self._title = new_title
        self._updated_at = datetime.utcnow()

    def update_description(self, new_description: str) -> None:
        """Update step description.

        Args:
            new_description: New description
        """
        self._description = new_description
        self._updated_at = datetime.utcnow()

    def update_duration(self, new_duration: StepDuration) -> None:
        """Update step duration.

        Args:
            new_duration: New duration (positive integer)
        """
        self._duration = new_duration
        self._updated_at = datetime.utcnow()

    def update_order(self, new_order: int) -> None:
        """Update step order.

        Args:
            new_order: New order (non-negative)

        Raises:
            ValidationException: If new_order is negative
        """
        if new_order < 0:
            raise ValidationException("Step order must be non-negative")

        self._order = new_order
        self._updated_at = datetime.utcnow()
