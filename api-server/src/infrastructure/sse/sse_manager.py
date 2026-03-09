"""SSE connection manager for per-user server-sent event streams."""

import asyncio
import logging
from typing import Any

logger = logging.getLogger(__name__)


class SSEManager:
    """Manages active SSE connections grouped by user ID.

    Each connection is represented by a dedicated asyncio.Queue.
    Supports multiple simultaneous connections per user (e.g. multiple tabs).
    Thread-safe via asyncio.Lock.
    """

    def __init__(self) -> None:
        self._connections: dict[str, list[asyncio.Queue[dict[str, Any]]]] = {}
        self._lock = asyncio.Lock()

    async def add_connection(self, user_id: str) -> asyncio.Queue[dict[str, Any]]:
        """Register a new SSE connection for a user.

        Returns:
            A fresh asyncio.Queue the caller should consume from to read events.
        """
        queue: asyncio.Queue[dict[str, Any]] = asyncio.Queue()
        async with self._lock:
            self._connections.setdefault(user_id, []).append(queue)
        logger.debug("SSE connection added for user %s", user_id)
        return queue

    async def remove_connection(
        self, user_id: str, queue: asyncio.Queue[dict[str, Any]]
    ) -> None:
        """Deregister an SSE connection for a user.

        Safe to call even if the user or queue is not registered.
        """
        async with self._lock:
            queues = self._connections.get(user_id, [])
            if queue in queues:
                queues.remove(queue)
            if not queues:
                self._connections.pop(user_id, None)
        logger.debug("SSE connection removed for user %s", user_id)

    async def send_to_user(self, user_id: str, data: dict[str, Any]) -> None:
        """Deliver a message to all active SSE connections for a user.

        If the user has no active connections this is a no-op.
        """
        async with self._lock:
            queues = list(self._connections.get(user_id, []))

        for queue in queues:
            await queue.put(data)
