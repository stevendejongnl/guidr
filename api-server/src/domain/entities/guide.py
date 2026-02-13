"""Guide domain entity."""

from datetime import UTC, datetime
from typing import Any

from ..value_objects import EntityId, GuideTitle, GuideType
from ..value_objects.guide_type import validate_metadata


class Guide:
    """Guide entity representing a collection of ordered steps."""

    def __init__(
        self,
        id: EntityId,
        guide_type: GuideType,
        title: GuideTitle,
        description: str | None = None,
        metadata: dict[str, Any] | None = None,
        step_ids: list[EntityId] | None = None,
        created_by_user_id: EntityId | None = None,
        is_public: bool = False,
        is_highlighted: bool = False,
        created_at: datetime | None = None,
        updated_at: datetime | None = None,
    ):
        """Initialize a Guide.

        Args:
            id: Unique identifier
            guide_type: Predefined guide type
            title: Guide title (non-empty)
            description: Optional description
            metadata: Optional type-specific metadata
            step_ids: Optional list of step IDs
            created_by_user_id: Optional ID of user who created the guide
            is_public: Whether the guide is publicly visible
            is_highlighted: Whether the guide is highlighted
            created_at: Optional creation timestamp
            updated_at: Optional update timestamp

        Raises:
            ValueError: If metadata is invalid for the guide type
        """
        validate_metadata(guide_type, metadata)

        self._id = id
        self._guide_type = guide_type
        self._title = title
        self._description = description
        self._metadata = metadata
        self._step_ids = step_ids or []
        self._created_by_user_id = created_by_user_id
        self._is_public = is_public
        self._is_highlighted = is_highlighted
        self._created_at = created_at or datetime.now(UTC)
        self._updated_at = updated_at or datetime.now(UTC)

    @property
    def id(self) -> EntityId:
        """Get entity ID."""
        return self._id

    @property
    def guide_type(self) -> GuideType:
        """Get guide type."""
        return self._guide_type

    @property
    def title(self) -> GuideTitle:
        """Get guide title."""
        return self._title

    @property
    def description(self) -> str | None:
        """Get guide description."""
        return self._description

    @property
    def metadata(self) -> dict[str, Any] | None:
        """Get guide metadata."""
        return self._metadata

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

    @property
    def created_by_user_id(self) -> EntityId | None:
        """Get ID of user who created the guide."""
        return self._created_by_user_id

    @property
    def is_public(self) -> bool:
        """Check if guide is publicly visible."""
        return self._is_public

    @property
    def is_highlighted(self) -> bool:
        """Check if guide is highlighted for homepage."""
        return self._is_highlighted

    def update_title(self, new_title: GuideTitle) -> None:
        """Update guide title."""
        self._title = new_title
        self._updated_at = datetime.now(UTC)

    def update_description(self, new_description: str) -> None:
        """Update guide description."""
        self._description = new_description
        self._updated_at = datetime.now(UTC)

    def update_metadata(
        self, new_metadata: dict[str, Any] | None
    ) -> None:
        """Update guide metadata.

        Args:
            new_metadata: New metadata (validated against type schema)

        Raises:
            ValueError: If metadata is invalid for the guide type
        """
        validate_metadata(self._guide_type, new_metadata)
        self._metadata = new_metadata
        self._updated_at = datetime.now(UTC)

    def update_guide_type(
        self,
        new_type: GuideType,
        new_metadata: dict[str, Any] | None = None,
    ) -> None:
        """Update guide type and reset metadata.

        Args:
            new_type: New guide type
            new_metadata: Optional metadata for the new type

        Raises:
            ValueError: If new_metadata is invalid for the new type
        """
        validate_metadata(new_type, new_metadata)
        self._guide_type = new_type
        self._metadata = new_metadata
        self._updated_at = datetime.now(UTC)

    def reassign_user(self, new_user_id: EntityId) -> None:
        """Reassign guide to a different user.

        Args:
            new_user_id: ID of the new owner
        """
        self._created_by_user_id = new_user_id
        self._updated_at = datetime.now(UTC)

    def add_step(self, step_id: EntityId) -> None:
        """Add a step to this guide."""
        if step_id not in self._step_ids:
            self._step_ids.append(step_id)
            self._updated_at = datetime.now(UTC)

    def remove_step(self, step_id: EntityId) -> None:
        """Remove a step from this guide."""
        if step_id in self._step_ids:
            self._step_ids.remove(step_id)
            self._updated_at = datetime.now(UTC)

    def make_public(self) -> None:
        """Make this guide publicly visible."""
        self._is_public = True
        self._updated_at = datetime.now(UTC)

    def make_private(self) -> None:
        """Make this guide private."""
        self._is_public = False
        self._updated_at = datetime.now(UTC)

    def highlight(self) -> None:
        """Highlight this guide for homepage featuring."""
        self._is_highlighted = True
        self._updated_at = datetime.now(UTC)

    def unhighlight(self) -> None:
        """Remove highlight from this guide."""
        self._is_highlighted = False
        self._updated_at = datetime.now(UTC)
