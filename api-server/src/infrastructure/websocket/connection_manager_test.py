"""Tests for WebSocket connection manager."""

import json
from unittest.mock import AsyncMock

import pytest

from src.infrastructure.websocket.connection_manager import (
    ConnectionManager,
)


class TestConnectionManager:
    """Test WebSocket connection manager."""

    @pytest.fixture
    def manager(self):
        return ConnectionManager()

    def _make_ws(self, *, fail_send: bool = False):
        """Create a mock WebSocket."""
        ws = AsyncMock()
        ws.send_text = AsyncMock()
        if fail_send:
            ws.send_text.side_effect = Exception("closed")
        return ws

    @pytest.mark.asyncio
    async def test_connect_and_broadcast(self, manager):
        """Connected client receives broadcast."""
        ws = self._make_ws()
        await manager.connect("user-1", ws)
        await manager.broadcast_to_user(
            "user-1", {"type": "timer.started"}
        )

        ws.send_text.assert_called_once()
        payload = json.loads(ws.send_text.call_args[0][0])
        assert payload["type"] == "timer.started"

    @pytest.mark.asyncio
    async def test_disconnect_removes_connection(self, manager):
        """Disconnected client does not receive broadcasts."""
        ws = self._make_ws()
        await manager.connect("user-1", ws)
        await manager.disconnect("user-1", ws)
        await manager.broadcast_to_user(
            "user-1", {"type": "timer.paused"}
        )

        ws.send_text.assert_not_called()

    @pytest.mark.asyncio
    async def test_multiple_devices_per_user(self, manager):
        """Multiple connections for same user all receive."""
        ws1 = self._make_ws()
        ws2 = self._make_ws()
        await manager.connect("user-1", ws1)
        await manager.connect("user-1", ws2)
        await manager.broadcast_to_user(
            "user-1", {"type": "timer.reset"}
        )

        ws1.send_text.assert_called_once()
        ws2.send_text.assert_called_once()

    @pytest.mark.asyncio
    async def test_broadcast_only_to_target_user(self, manager):
        """Messages only go to the target user."""
        ws1 = self._make_ws()
        ws2 = self._make_ws()
        await manager.connect("user-1", ws1)
        await manager.connect("user-2", ws2)
        await manager.broadcast_to_user(
            "user-1", {"type": "timer.started"}
        )

        ws1.send_text.assert_called_once()
        ws2.send_text.assert_not_called()

    @pytest.mark.asyncio
    async def test_stale_connection_removed_on_send_failure(
        self, manager
    ):
        """Failed send removes stale connection."""
        ws_good = self._make_ws()
        ws_bad = self._make_ws(fail_send=True)
        await manager.connect("user-1", ws_good)
        await manager.connect("user-1", ws_bad)
        await manager.broadcast_to_user(
            "user-1", {"type": "ping"}
        )

        # Good one still receives
        ws_good.send_text.assert_called_once()
        # Bad one removed — second broadcast only hits good
        ws_good.send_text.reset_mock()
        await manager.broadcast_to_user(
            "user-1", {"type": "pong"}
        )
        ws_good.send_text.assert_called_once()

    @pytest.mark.asyncio
    async def test_broadcast_to_unknown_user_is_noop(
        self, manager
    ):
        """Broadcasting to non-existent user doesn't raise."""
        await manager.broadcast_to_user(
            "nobody", {"type": "test"}
        )

    @pytest.mark.asyncio
    async def test_broadcast_all(self, manager):
        """broadcast_all sends to all connected users."""
        ws1 = self._make_ws()
        ws2 = self._make_ws()
        await manager.connect("user-1", ws1)
        await manager.connect("user-2", ws2)
        await manager.broadcast_all({"type": "server.shutdown"})

        ws1.send_text.assert_called_once()
        ws2.send_text.assert_called_once()
