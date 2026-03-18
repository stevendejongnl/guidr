"""Session status value object."""

from enum import StrEnum


class SessionStatus(StrEnum):
    """Session status enum.

    Represents the possible states of a session.
    Inherits from str for compatibility with Pydantic and JSON serialization.
    """

    NOT_STARTED = "NotStarted"
    IN_PROGRESS = "InProgress"
    PAUSED = "Paused"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"

    def __str__(self) -> str:
        """Return string representation."""
        return self.value
