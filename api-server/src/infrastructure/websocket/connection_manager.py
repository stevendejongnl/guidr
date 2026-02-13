"""WebSocket connection manager for per-user broadcasting."""

import asyncio
import json
import logging
from typing import Any, Protocol

logger = logging.getLogger(__name__)


class WebSocketLike(Protocol):
    """Minimal WebSocket interface for type safety."""

    async def send_text(self, data: str) -> None: ...


class ConnectionManager:
    """Manages WebSocket connections grouped by user ID.

    Supports multiple devices per user. Stale connections are
    automatically removed on send failure.
    """

    def __init__(self) -> None:
        self._connections: dict[
            str, list[WebSocketLike]
        ] = {}
        self._lock = asyncio.Lock()

    async def connect(
        self, user_id: str, websocket: WebSocketLike
    ) -> None:
        """Register a WebSocket connection for a user."""
        async with self._lock:
            self._connections.setdefault(user_id, []).append(
                websocket
            )

    async def disconnect(
        self, user_id: str, websocket: WebSocketLike
    ) -> None:
        """Remove a WebSocket connection for a user."""
        async with self._lock:
            conns = self._connections.get(user_id, [])
            if websocket in conns:
                conns.remove(websocket)
            if not conns:
                self._connections.pop(user_id, None)

    async def broadcast_to_user(
        self, user_id: str, message: dict[str, Any]
    ) -> None:
        """Send a message to all connections of a user."""
        async with self._lock:
            conns = self._connections.get(user_id, [])
            if not conns:
                return

            text = json.dumps(message)
            stale: list[WebSocketLike] = []

            for ws in conns:
                try:
                    await ws.send_text(text)
                except Exception:
                    logger.warning(
                        "Removing stale connection for user %s",
                        user_id,
                    )
                    stale.append(ws)

            for ws in stale:
                conns.remove(ws)
            if not conns:
                self._connections.pop(user_id, None)

    async def broadcast_all(
        self, message: dict[str, Any]
    ) -> None:
        """Send a message to all connected users."""
        user_ids = list(self._connections.keys())
        for user_id in user_ids:
            await self.broadcast_to_user(user_id, message)
