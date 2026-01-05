"""Session domain events."""

from dataclasses import dataclass

from .base import BaseDomainEvent


@dataclass(frozen=True)
class SessionCreated(BaseDomainEvent):
    """Event raised when a session is created."""

    session_id: str
    guide_id: str


@dataclass(frozen=True)
class SessionStarted(BaseDomainEvent):
    """Event raised when a session is started."""

    session_id: str
    guide_id: str
    started_at: str  # ISO format datetime


@dataclass(frozen=True)
class SessionPaused(BaseDomainEvent):
    """Event raised when a session is paused."""

    session_id: str


@dataclass(frozen=True)
class SessionResumed(BaseDomainEvent):
    """Event raised when a session is resumed."""

    session_id: str


@dataclass(frozen=True)
class SessionCompleted(BaseDomainEvent):
    """Event raised when a session is completed."""

    session_id: str
    completed_at: str  # ISO format datetime


@dataclass(frozen=True)
class SessionCancelled(BaseDomainEvent):
    """Event raised when a session is cancelled."""

    session_id: str
    cancelled_at: str  # ISO format datetime


@dataclass(frozen=True)
class SessionStepChanged(BaseDomainEvent):
    """Event raised when the current step changes in a session."""

    session_id: str
    previous_step_id: str | None
    current_step_id: str
