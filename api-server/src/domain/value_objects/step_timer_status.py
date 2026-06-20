"""Step timer status value object."""

from enum import StrEnum


class StepTimerStatus(StrEnum):
    """Step timer status enum.

    Represents the possible states of a step timer.
    Inherits from str for compatibility with Pydantic and JSON serialization.
    """

    IDLE = "idle"
    RUNNING = "running"
    PAUSED = "paused"

