"""Step timer domain events."""

from dataclasses import dataclass

from .base import BaseDomainEvent


@dataclass(frozen=True)
class StepTimerStarted(BaseDomainEvent):
    """Event raised when a step timer is started or resumed."""

    timer_id: str
    step_id: str
    guide_id: str
    user_id: str
    started_at: str  # ISO format datetime
    accumulated_seconds: int
    duration_seconds: int


@dataclass(frozen=True)
class StepTimerPaused(BaseDomainEvent):
    """Event raised when a step timer is paused."""

    timer_id: str
    step_id: str
    guide_id: str
    user_id: str
    accumulated_seconds: int


@dataclass(frozen=True)
class StepTimerReset(BaseDomainEvent):
    """Event raised when a step timer is reset."""

    timer_id: str
    step_id: str
    guide_id: str
    user_id: str
