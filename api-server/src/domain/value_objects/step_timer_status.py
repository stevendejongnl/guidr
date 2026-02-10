"""Step timer status value object."""

from enum import Enum


class StepTimerStatus(str, Enum):
    """Step timer status enum.

    Represents the possible states of a step timer.
    Inherits from str for compatibility with Pydantic and JSON serialization.
    """

    IDLE = "idle"
    RUNNING = "running"
    PAUSED = "paused"

    def __str__(self) -> str:
        """Return string representation."""
        return self.value
