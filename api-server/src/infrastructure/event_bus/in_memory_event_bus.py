"""In-memory async event bus implementation."""

import logging

from src.domain.events.base import BaseDomainEvent
from src.domain.services.event_bus import EventHandler

logger = logging.getLogger(__name__)


class InMemoryEventBus:
    """In-memory event bus for single-process deployments.

    Supports typed subscriptions (specific event class) and wildcard
    subscriptions (None = receive all events). Sufficient for single-pod;
    swap to Redis Pub/Sub later via same IEventBus interface.
    """

    def __init__(self) -> None:
        self._wildcard_handlers: list[EventHandler] = []
        self._typed_handlers: dict[
            type[BaseDomainEvent], list[EventHandler]
        ] = {}

    async def publish(self, event: BaseDomainEvent) -> None:
        """Publish event to all matching handlers."""
        handlers = list(self._wildcard_handlers)
        handlers.extend(
            self._typed_handlers.get(type(event), [])
        )

        for handler in handlers:
            try:
                await handler(event)
            except Exception:
                logger.exception(
                    "Event handler failed for %s",
                    event.event_type,
                )

    def subscribe(
        self,
        event_type: type[BaseDomainEvent] | None,
        handler: EventHandler,
    ) -> None:
        """Subscribe to events by type, or None for all."""
        if event_type is None:
            self._wildcard_handlers.append(handler)
        else:
            self._typed_handlers.setdefault(event_type, []).append(
                handler
            )
