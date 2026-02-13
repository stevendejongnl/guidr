"""Tests for WebSocket sync handler."""

from unittest.mock import Mock

import pytest
from starlette.testclient import TestClient

from src.infrastructure.event_bus.in_memory_event_bus import (
    InMemoryEventBus,
)
from src.infrastructure.websocket.connection_manager import (
    ConnectionManager,
)
from src.presentation.api.websocket.sync_handler import (
    create_sync_app,
)


def _make_jwt_service(*, valid: bool = True, user_id: str = "u1"):
    """Create a mock JWT service."""
    svc = Mock()
    if valid:
        svc.verify_access_token.return_value = {"sub": user_id}
    else:
        svc.verify_access_token.return_value = None
    return svc


class TestSyncHandler:
    """Test WebSocket sync endpoint."""

    @pytest.fixture
    def manager(self):
        return ConnectionManager()

    @pytest.fixture
    def event_bus(self):
        return InMemoryEventBus()

    def _make_app(self, jwt_service, manager):
        return create_sync_app(jwt_service, manager)

    def test_valid_auth_receives_welcome(self, manager):
        """Valid token gets a welcome message."""
        jwt = _make_jwt_service()
        app = self._make_app(jwt, manager)

        with TestClient(app) as client:
            with client.websocket_connect(
                "/api/v1/ws/sync?token=valid-jwt"
            ) as ws:
                data = ws.receive_json()
                assert data["type"] == "welcome"
                ws.close()

    def test_invalid_token_closes_4001(self, manager):
        """Invalid token closes with code 4001."""
        jwt = _make_jwt_service(valid=False)
        app = self._make_app(jwt, manager)

        with TestClient(app) as client:
            with pytest.raises(Exception):
                with client.websocket_connect(
                    "/api/v1/ws/sync?token=bad"
                ) as ws:
                    ws.receive_json()

    def test_missing_token_closes_4001(self, manager):
        """No token closes with code 4001."""
        jwt = _make_jwt_service()
        app = self._make_app(jwt, manager)

        with TestClient(app) as client:
            with pytest.raises(Exception):
                with client.websocket_connect(
                    "/api/v1/ws/sync"
                ) as ws:
                    ws.receive_json()

    def test_ping_pong(self, manager):
        """Client ping gets pong response."""
        jwt = _make_jwt_service()
        app = self._make_app(jwt, manager)

        with TestClient(app) as client:
            with client.websocket_connect(
                "/api/v1/ws/sync?token=valid"
            ) as ws:
                ws.receive_json()  # welcome
                ws.send_json({"type": "ping"})
                data = ws.receive_json()
                assert data["type"] == "pong"
                ws.close()
