"""Base domain event."""

from dataclasses import dataclass, field
from datetime import UTC, datetime
from uuid import uuid4


@dataclass(frozen=True)
class BaseDomainEvent:
    """Base class for all domain events.

    Domain events represent something that happened in the domain
    that other parts of the system might be interested in.

    Events are immutable and contain all information about what happened.
    """

    event_id: str = field(default_factory=lambda: str(uuid4()), kw_only=True)
    occurred_at: datetime = field(default_factory=lambda: datetime.now(UTC), kw_only=True)

    @property
    def event_type(self) -> str:
        """Get the event type (class name)."""
        return self.__class__.__name__
