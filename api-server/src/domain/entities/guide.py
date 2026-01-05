"""Guide domain entity."""

from datetime import UTC, datetime

from ..value_objects import EntityId, GuideTitle


class Guide:
    """Guide entity representing a collection of ordered steps."""

    def __init__(
        self,
        id: EntityId,
        category_id: EntityId,
        title: GuideTitle,
        description: str | None = None,
        step_ids: list[EntityId] | None = None,
        created_at: datetime | None = None,
        updated_at: datetime | None = None,
    ):
        """Initialize a Guide.

        Args:
            id: Unique identifier
            category_id: Parent category ID
            title: Guide title (non-empty)
            description: Optional description
            step_ids: Optional list of step IDs
            created_at: Optional creation timestamp (defaults to now)
            updated_at: Optional update timestamp (defaults to now)
        """
        self._id = id
        self._category_id = category_id
        self._title = title
        self._description = description
        self._step_ids = step_ids or []
        self._created_at = created_at or datetime.now(UTC)
        self._updated_at = updated_at or datetime.now(UTC)

    @property
    def id(self) -> EntityId:
        """Get entity ID."""
        return self._id

    @property
    def category_id(self) -> EntityId:
        """Get category ID."""
        return self._category_id

    @property
    def title(self) -> GuideTitle:
        """Get guide title."""
        return self._title

    @property
    def description(self) -> str | None:
        """Get guide description."""
        return self._description

    @property
    def step_ids(self) -> list[EntityId]:
        """Get immutable copy of step IDs."""
        return self._step_ids.copy()

    @property
    def step_count(self) -> int:
        """Get number of steps in this guide."""
        return len(self._step_ids)

    @property
    def created_at(self) -> datetime:
        """Get creation timestamp."""
        return self._created_at

    @property
    def updated_at(self) -> datetime:
        """Get last update timestamp."""
        return self._updated_at

    def update_title(self, new_title: GuideTitle) -> None:
        """Update guide title.

        Args:
            new_title: New title (non-empty)
        """
        self._title = new_title
        self._updated_at = datetime.now(UTC)

    def update_description(self, new_description: str) -> None:
        """Update guide description.

        Args:
            new_description: New description
        """
        self._description = new_description
        self._updated_at = datetime.now(UTC)

    def add_step(self, step_id: EntityId) -> None:
        """Add a step to this guide.

        Args:
            step_id: ID of step to add

        Note:
            Step is only added if not already in the list
        """
        if step_id not in self._step_ids:
            self._step_ids.append(step_id)
            self._updated_at = datetime.now(UTC)

    def remove_step(self, step_id: EntityId) -> None:
        """Remove a step from this guide.

        Args:
            step_id: ID of step to remove

        Note:
            No error if step_id not found
        """
        if step_id in self._step_ids:
            self._step_ids.remove(step_id)
            self._updated_at = datetime.now(UTC)
