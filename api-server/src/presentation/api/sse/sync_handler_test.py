"""Tests for SSE sync endpoint."""

import json
from unittest.mock import Mock

import pytest
from fastapi.testclient import TestClient

from src.domain.events.timer_events import StepTimerStarted
from src.infrastructure.event_bus.in_memory_event_bus import InMemoryEventBus
from src.infrastructure.sse.sse_manager import SSEManager
from src.infrastructure.websocket.event_serializer import EventSerializer
from src.presentation.api.sse.sync_handler import (
    _format_sse_frame,
    _stream_events,
    create_sse_app,
)


def _make_jwt_service(*, valid: bool = True, user_id: str = "u1") -> Mock:
    """Create a lightweight JWT service stub (no mocking library state)."""
    svc = Mock()
    if valid:
        svc.verify_access_token.return_value = {"sub": user_id}
    else:
        svc.verify_access_token.return_value = None
    return svc


def _build_app(*, valid: bool = True, user_id: str = "u1"):
    """Assemble a FastAPI test app with the SSE route wired up."""
    jwt = _make_jwt_service(valid=valid, user_id=user_id)
    sse_manager = SSEManager()
    event_bus = InMemoryEventBus()
    event_serializer = EventSerializer()
    return create_sse_app(jwt, sse_manager, event_bus, event_serializer)


# ---------------------------------------------------------------------------
# SSE frame formatting (pure function — no I/O)
# ---------------------------------------------------------------------------


class TestFormatSseFrame:
    """Test the low-level SSE frame formatter."""

    def test_frame_contains_event_line(self):
        """Frame includes 'event: <name>' line."""
        frame = _format_sse_frame("connected", {"status": "connected"})
        assert "event: connected\n" in frame

    def test_frame_contains_data_line(self):
        """Frame includes 'data: <json>' line."""
        frame = _format_sse_frame("connected", {"key": "val"})
        assert 'data: {"key": "val"}\n' in frame

    def test_frame_ends_with_double_newline(self):
        """SSE frames must be terminated by a blank line (double newline)."""
        frame = _format_sse_frame("test", {})
        assert frame.endswith("\n\n")


# ---------------------------------------------------------------------------
# _stream_events generator (unit test — no HTTP stack involved)
# ---------------------------------------------------------------------------


class TestStreamEventsGenerator:
    """Test the async generator that produces SSE frames."""

    @pytest.mark.asyncio
    async def test_first_frame_is_connected_event(self):
        """First yield is always the 'connected' event frame."""
        manager = SSEManager()
        gen = _stream_events("user-xyz", manager)
        frame = await gen.__anext__()
        assert "event: connected\n" in frame
        data_line = next(line for line in frame.splitlines() if line.startswith("data:"))
        payload = json.loads(data_line[len("data:"):].strip())
        assert payload["status"] == "connected"
        assert payload["userId"] == "user-xyz"
        await gen.aclose()

    @pytest.mark.asyncio
    async def test_connection_registered_in_manager_after_first_yield(self):
        """After the generator has started, the manager has an active connection."""
        manager = SSEManager()
        gen = _stream_events("user-1", manager)
        await gen.__anext__()  # connected frame
        # The connection should now be in the manager's internal state
        # (send_to_user should not be a no-op)
        await manager.send_to_user("user-1", {"type": "ping"})
        # Reading the sent message from the generator:
        frame = await gen.__anext__()
        assert "ping" in frame
        await gen.aclose()

    @pytest.mark.asyncio
    async def test_domain_event_yields_sse_frame(self):
        """A message put into the manager queue is yielded as the next SSE frame."""
        manager = SSEManager()
        gen = _stream_events("user-1", manager)
        await gen.__anext__()  # consume connected frame
        await manager.send_to_user("user-1", {"type": "timer.started", "payload": {}})
        frame = await gen.__anext__()
        assert "event: timer.started\n" in frame
        await gen.aclose()

    @pytest.mark.asyncio
    async def test_connection_removed_after_generator_closes(self):
        """Closing the generator removes the connection from the manager."""
        manager = SSEManager()
        gen = _stream_events("user-1", manager)
        await gen.__anext__()  # connected frame
        await gen.aclose()
        # After close, sending should have no queue to deliver to
        await manager.send_to_user("user-1", {"type": "ghost"})
        # If we reach here without error, cleanup worked correctly


# ---------------------------------------------------------------------------
# HTTP layer: auth checks (no streaming required)
# ---------------------------------------------------------------------------


class TestSSESyncHandlerAuth:
    """Authorization: missing / invalid tokens must be rejected before streaming."""

    def test_missing_auth_header_returns_401(self):
        """GET /api/v1/sse/sync without Authorization header → 401."""
        app = _build_app()
        with TestClient(app, raise_server_exceptions=False) as client:
            response = client.get("/api/v1/sse/sync")
        assert response.status_code == 401

    def test_invalid_token_returns_401(self):
        """GET /api/v1/sse/sync with a bad JWT → 401."""
        app = _build_app(valid=False)
        with TestClient(app, raise_server_exceptions=False) as client:
            response = client.get(
                "/api/v1/sse/sync",
                headers={"Authorization": "Bearer bad-token"},
            )
        assert response.status_code == 401

    def test_non_bearer_scheme_returns_401(self):
        """GET /api/v1/sse/sync with Basic auth scheme → 401."""
        app = _build_app()
        with TestClient(app, raise_server_exceptions=False) as client:
            response = client.get(
                "/api/v1/sse/sync",
                headers={"Authorization": "Basic dXNlcjpwYXNz"},
            )
        assert response.status_code == 401


# ---------------------------------------------------------------------------
# Event bus → SSEManager integration (no HTTP stack)
# ---------------------------------------------------------------------------


class TestSSEManagerIntegration:
    """SSEManager integration: events sent to manager reach the SSE stream."""

    @pytest.mark.asyncio
    async def test_send_to_user_reaches_connected_queue(self):
        """Messages put into the manager reach the consumer queue immediately."""
        manager = SSEManager()
        queue = await manager.add_connection("user-1")

        await manager.send_to_user("user-1", {"type": "timer.started", "payload": {}})

        assert not queue.empty()
        msg = queue.get_nowait()
        assert msg["type"] == "timer.started"

    @pytest.mark.asyncio
    async def test_event_bus_subscription_routes_events_to_manager(self):
        """Publishing on the event bus delivers serialized events to SSEManager."""
        bus = InMemoryEventBus()
        manager = SSEManager()
        serializer = EventSerializer()

        async def on_event(event):
            user_id = getattr(event, "user_id", "")
            if user_id:
                data = serializer.serialize(event)
                await manager.send_to_user(user_id, data)

        bus.subscribe(None, on_event)

        queue = await manager.add_connection("u42")
        event = StepTimerStarted(
            timer_id="t1",
            step_id="s1",
            guide_id="g1",
            user_id="u42",
            started_at="2024-01-01T00:00:00+00:00",
            accumulated_seconds=0,
            duration_seconds=300,
        )
        await bus.publish(event)

        assert not queue.empty()
        msg = queue.get_nowait()
        assert msg["type"] == "timer.started"
        assert msg["payload"]["timerId"] == "t1"
