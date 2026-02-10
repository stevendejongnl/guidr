"""GuideFavorite domain entity."""

from datetime import UTC, datetime

from ..value_objects import EntityId


class GuideFavorite:
    """GuideFavorite entity representing a user's favorite guide.

    Simple association entity: links a user to a guide they've favorited.
    No state machine — favorites are created and deleted, not transitioned.
    """

    def __init__(
        self,
        id: EntityId,
        user_id: EntityId,
        guide_id: EntityId,
        created_at: datetime | None = None,
    ):
        """Initialize a GuideFavorite.

        Args:
            id: Unique identifier
            user_id: User who favorited the guide
            guide_id: Guide that was favorited
            created_at: Optional creation timestamp (defaults to now)
        """
        self._id = id
        self._user_id = user_id
        self._guide_id = guide_id
        self._created_at = created_at or datetime.now(UTC)

    @property
    def id(self) -> EntityId:
        """Get entity ID."""
        return self._id

    @property
    def user_id(self) -> EntityId:
        """Get user ID."""
        return self._user_id

    @property
    def guide_id(self) -> EntityId:
        """Get guide ID."""
        return self._guide_id

    @property
    def created_at(self) -> datetime:
        """Get creation timestamp."""
        return self._created_at
