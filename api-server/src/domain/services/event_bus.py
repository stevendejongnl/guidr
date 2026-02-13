"""Event bus protocol for domain event publishing."""

from collections.abc import Awaitable, Callable
from typing import Protocol

from src.domain.events.base import BaseDomainEvent

EventHandler = Callable[[BaseDomainEvent], Awaitable[None]]


class IEventBus(Protocol):
    """Protocol for publishing domain events."""

    async def publish(self, event: BaseDomainEvent) -> None:
        """Publish a domain event to all subscribers."""
        ...

    def subscribe(
        self,
        event_type: type[BaseDomainEvent] | None,
        handler: EventHandler,
    ) -> None:
        """Subscribe to events.

        Args:
            event_type: Event class to subscribe to, or None for all.
            handler: Async callable that receives the event.
        """
        ...
