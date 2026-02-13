"""Tests for in-memory event bus."""

from dataclasses import dataclass

import pytest

from src.domain.events.base import BaseDomainEvent
from src.domain.events.timer_events import StepTimerStarted
from src.infrastructure.event_bus.in_memory_event_bus import InMemoryEventBus


@dataclass(frozen=True)
class FakeEvent(BaseDomainEvent):
    """Test event."""

    value: str


@dataclass(frozen=True)
class OtherEvent(BaseDomainEvent):
    """Another test event."""

    count: int


class TestInMemoryEventBus:
    """Test in-memory event bus."""

    @pytest.fixture
    def bus(self):
        return InMemoryEventBus()

    @pytest.mark.asyncio
    async def test_publish_calls_wildcard_handler(self, bus):
        """Wildcard handler receives all events."""
        received: list[BaseDomainEvent] = []

        async def handler(event: BaseDomainEvent) -> None:
            received.append(event)

        bus.subscribe(None, handler)
        event = FakeEvent(value="test")
        await bus.publish(event)

        assert len(received) == 1
        assert received[0] is event

    @pytest.mark.asyncio
    async def test_publish_calls_typed_handler(self, bus):
        """Typed handler only receives matching events."""
        received: list[BaseDomainEvent] = []

        async def handler(event: BaseDomainEvent) -> None:
            received.append(event)

        bus.subscribe(FakeEvent, handler)
        await bus.publish(FakeEvent(value="yes"))
        await bus.publish(OtherEvent(count=1))

        assert len(received) == 1

    @pytest.mark.asyncio
    async def test_multiple_handlers(self, bus):
        """Multiple handlers all receive events."""
        calls: list[str] = []

        async def h1(event: BaseDomainEvent) -> None:
            calls.append("h1")

        async def h2(event: BaseDomainEvent) -> None:
            calls.append("h2")

        bus.subscribe(None, h1)
        bus.subscribe(None, h2)
        await bus.publish(FakeEvent(value="x"))

        assert calls == ["h1", "h2"]

    @pytest.mark.asyncio
    async def test_no_handlers_is_ok(self, bus):
        """Publishing with no handlers doesn't raise."""
        await bus.publish(FakeEvent(value="ignored"))

    @pytest.mark.asyncio
    async def test_timer_started_event(self, bus):
        """Timer events work with the bus."""
        received: list[BaseDomainEvent] = []

        async def handler(event: BaseDomainEvent) -> None:
            received.append(event)

        bus.subscribe(StepTimerStarted, handler)
        event = StepTimerStarted(
            timer_id="t1",
            step_id="s1",
            guide_id="g1",
            user_id="u1",
            started_at="2024-01-01T00:00:00+00:00",
            accumulated_seconds=0,
            duration_seconds=300,
        )
        await bus.publish(event)

        assert len(received) == 1
        assert isinstance(received[0], StepTimerStarted)

    @pytest.mark.asyncio
    async def test_handler_error_does_not_break_others(self, bus):
        """One handler failing doesn't prevent others."""
        calls: list[str] = []

        async def bad(event: BaseDomainEvent) -> None:
            raise RuntimeError("boom")

        async def good(event: BaseDomainEvent) -> None:
            calls.append("ok")

        bus.subscribe(None, bad)
        bus.subscribe(None, good)
        await bus.publish(FakeEvent(value="x"))

        assert calls == ["ok"]
