"""Serialize domain events to WebSocket message format."""

from typing import Any

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


class EventSerializer:
    """Maps domain events to camelCase WebSocket messages."""

    def serialize(
        self, event: BaseDomainEvent
    ) -> dict[str, Any]:
        """Convert a domain event to a WS message dict."""
        if isinstance(event, StepTimerStarted):
            return {
                "type": "timer.started",
                "payload": {
                    "timerId": event.timer_id,
                    "stepId": event.step_id,
                    "guideId": event.guide_id,
                    "startedAt": event.started_at,
                    "accumulatedSeconds": (
                        event.accumulated_seconds
                    ),
                    "durationSeconds": event.duration_seconds,
                },
            }

        if isinstance(event, StepTimerPaused):
            return {
                "type": "timer.paused",
                "payload": {
                    "timerId": event.timer_id,
                    "stepId": event.step_id,
                    "guideId": event.guide_id,
                    "accumulatedSeconds": (
                        event.accumulated_seconds
                    ),
                },
            }

        if isinstance(event, StepTimerReset):
            return {
                "type": "timer.reset",
                "payload": {
                    "timerId": event.timer_id,
                    "stepId": event.step_id,
                    "guideId": event.guide_id,
                },
            }

        if isinstance(event, SessionStarted):
            return {
                "type": "session.started",
                "payload": {
                    "sessionId": event.session_id,
                    "guideId": event.guide_id,
                    "startedAt": event.started_at,
                },
            }

        if isinstance(event, SessionPaused):
            return {
                "type": "session.paused",
                "payload": {
                    "sessionId": event.session_id,
                },
            }

        if isinstance(event, SessionResumed):
            return {
                "type": "session.resumed",
                "payload": {
                    "sessionId": event.session_id,
                },
            }

        if isinstance(event, SessionCompleted):
            return {
                "type": "session.completed",
                "payload": {
                    "sessionId": event.session_id,
                    "completedAt": event.completed_at,
                },
            }

        if isinstance(event, SessionCancelled):
            return {
                "type": "session.cancelled",
                "payload": {
                    "sessionId": event.session_id,
                    "cancelledAt": event.cancelled_at,
                },
            }

        if isinstance(event, SessionStepChanged):
            return {
                "type": "session.step_changed",
                "payload": {
                    "sessionId": event.session_id,
                    "previousStepId": event.previous_step_id,
                    "currentStepId": event.current_step_id,
                },
            }

        return {
            "type": "unknown",
            "payload": {
                "eventType": event.event_type,
            },
        }
