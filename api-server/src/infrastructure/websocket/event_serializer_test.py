"""Tests for event serializer."""

from dataclasses import dataclass

import pytest

from src.domain.events.base import BaseDomainEvent
from src.domain.events.session_events import (
    SessionCancelled,
    SessionCompleted,
    SessionPaused,
    SessionResumed,
    SessionStarted,
    SessionStepChanged,
)
from src.domain.events.timer_events import (
    StepTimerPaused,
    StepTimerReset,
    StepTimerStarted,
)
from src.infrastructure.websocket.event_serializer import (
    EventSerializer,
)


class TestEventSerializer:
    """Test domain event to WebSocket message serialization."""

    @pytest.fixture
    def serializer(self):
        return EventSerializer()

    def test_timer_started(self, serializer):
        event = StepTimerStarted(
            timer_id="t1",
            step_id="s1",
            guide_id="g1",
            user_id="u1",
            started_at="2024-01-01T00:00:00+00:00",
            accumulated_seconds=10,
            duration_seconds=300,
        )
        msg = serializer.serialize(event)
        assert msg["type"] == "timer.started"
        assert msg["payload"]["timerId"] == "t1"
        assert msg["payload"]["stepId"] == "s1"
        assert msg["payload"]["guideId"] == "g1"
        assert msg["payload"]["startedAt"] == (
            "2024-01-01T00:00:00+00:00"
        )
        assert msg["payload"]["accumulatedSeconds"] == 10
        assert msg["payload"]["durationSeconds"] == 300

    def test_timer_paused(self, serializer):
        event = StepTimerPaused(
            timer_id="t1",
            step_id="s1",
            guide_id="g1",
            user_id="u1",
            accumulated_seconds=45,
        )
        msg = serializer.serialize(event)
        assert msg["type"] == "timer.paused"
        assert msg["payload"]["timerId"] == "t1"
        assert msg["payload"]["accumulatedSeconds"] == 45

    def test_timer_reset(self, serializer):
        event = StepTimerReset(
            timer_id="t1",
            step_id="s1",
            guide_id="g1",
            user_id="u1",
        )
        msg = serializer.serialize(event)
        assert msg["type"] == "timer.reset"
        assert msg["payload"]["timerId"] == "t1"
        assert msg["payload"]["stepId"] == "s1"

    def test_session_started(self, serializer):
        event = SessionStarted(
            session_id="sess-1",
            guide_id="g1",
            user_id="u1",
            started_at="2024-01-01T00:00:00+00:00",
        )
        msg = serializer.serialize(event)
        assert msg["type"] == "session.started"
        assert msg["payload"]["sessionId"] == "sess-1"
        assert msg["payload"]["guideId"] == "g1"

    def test_session_paused(self, serializer):
        event = SessionPaused(
            session_id="sess-1", user_id="u1"
        )
        msg = serializer.serialize(event)
        assert msg["type"] == "session.paused"

    def test_session_resumed(self, serializer):
        event = SessionResumed(
            session_id="sess-1", user_id="u1"
        )
        msg = serializer.serialize(event)
        assert msg["type"] == "session.resumed"

    def test_session_completed(self, serializer):
        event = SessionCompleted(
            session_id="sess-1",
            user_id="u1",
            completed_at="2024-01-01T01:00:00+00:00",
        )
        msg = serializer.serialize(event)
        assert msg["type"] == "session.completed"
        assert msg["payload"]["completedAt"] == (
            "2024-01-01T01:00:00+00:00"
        )

    def test_session_cancelled(self, serializer):
        event = SessionCancelled(
            session_id="sess-1",
            user_id="u1",
            cancelled_at="2024-01-01T01:00:00+00:00",
        )
        msg = serializer.serialize(event)
        assert msg["type"] == "session.cancelled"

    def test_session_step_changed(self, serializer):
        event = SessionStepChanged(
            session_id="sess-1",
            user_id="u1",
            previous_step_id="s1",
            current_step_id="s2",
        )
        msg = serializer.serialize(event)
        assert msg["type"] == "session.step_changed"
        assert msg["payload"]["previousStepId"] == "s1"
        assert msg["payload"]["currentStepId"] == "s2"

    def test_unknown_event_returns_generic(self, serializer):
        @dataclass(frozen=True)
        class UnknownEvent(BaseDomainEvent):
            foo: str

        event = UnknownEvent(foo="bar")
        msg = serializer.serialize(event)
        assert msg["type"] == "unknown"
        assert msg["payload"]["eventType"] == "UnknownEvent"
