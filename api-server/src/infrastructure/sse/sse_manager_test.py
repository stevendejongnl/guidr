"""Tests for SSEManager."""

import asyncio

import pytest

from src.infrastructure.sse.sse_manager import SSEManager


class TestSSEManagerAddRemoveConnection:
    """Test connection lifecycle management."""

    @pytest.mark.asyncio
    async def test_add_connection_returns_queue(self):
        """add_connection returns an asyncio.Queue for the caller to consume."""
        manager = SSEManager()
        queue = await manager.add_connection("user-1")
        assert isinstance(queue, asyncio.Queue)

    @pytest.mark.asyncio
    async def test_add_multiple_connections_same_user_returns_distinct_queues(self):
        """Two connections for the same user get separate queues."""
        manager = SSEManager()
        q1 = await manager.add_connection("user-1")
        q2 = await manager.add_connection("user-1")
        assert q1 is not q2

    @pytest.mark.asyncio
    async def test_add_connections_different_users_returns_distinct_queues(self):
        """Connections for different users get separate queues."""
        manager = SSEManager()
        q1 = await manager.add_connection("user-1")
        q2 = await manager.add_connection("user-2")
        assert q1 is not q2

    @pytest.mark.asyncio
    async def test_remove_connection_cleans_up(self):
        """remove_connection removes the queue; send_to_user after removal is a no-op."""
        manager = SSEManager()
        queue = await manager.add_connection("user-1")
        await manager.remove_connection("user-1", queue)

        # After removal, sending should not put anything in the old queue
        await manager.send_to_user("user-1", {"type": "test"})
        assert queue.empty()

    @pytest.mark.asyncio
    async def test_remove_unknown_connection_is_safe(self):
        """remove_connection with an unknown user/queue does not raise."""
        manager = SSEManager()
        orphan_queue: asyncio.Queue[dict] = asyncio.Queue()
        await manager.remove_connection("ghost-user", orphan_queue)  # must not raise

    @pytest.mark.asyncio
    async def test_remove_one_of_multiple_connections_leaves_others(self):
        """Removing one connection keeps the other active."""
        manager = SSEManager()
        q1 = await manager.add_connection("user-1")
        q2 = await manager.add_connection("user-1")
        await manager.remove_connection("user-1", q1)

        await manager.send_to_user("user-1", {"type": "hello"})
        assert not q2.empty()
        assert q1.empty()


class TestSSEManagerSendToUser:
    """Test message delivery to queues."""

    @pytest.mark.asyncio
    async def test_send_to_user_puts_message_in_queue(self):
        """send_to_user delivers the data dict to the connection queue."""
        manager = SSEManager()
        queue = await manager.add_connection("user-1")

        await manager.send_to_user("user-1", {"type": "ping", "value": 42})

        assert not queue.empty()
        received = queue.get_nowait()
        assert received == {"type": "ping", "value": 42}

    @pytest.mark.asyncio
    async def test_send_to_user_delivers_to_all_connections(self):
        """send_to_user puts message in every queue for that user."""
        manager = SSEManager()
        q1 = await manager.add_connection("user-1")
        q2 = await manager.add_connection("user-1")

        await manager.send_to_user("user-1", {"type": "event"})

        assert q1.get_nowait() == {"type": "event"}
        assert q2.get_nowait() == {"type": "event"}

    @pytest.mark.asyncio
    async def test_send_to_user_does_not_affect_other_users(self):
        """send_to_user is isolated per user; other users' queues stay empty."""
        manager = SSEManager()
        q1 = await manager.add_connection("user-1")
        q2 = await manager.add_connection("user-2")

        await manager.send_to_user("user-1", {"type": "private"})

        assert not q1.empty()
        assert q2.empty()

    @pytest.mark.asyncio
    async def test_send_to_nonexistent_user_is_safe(self):
        """send_to_user with no registered connections does not raise."""
        manager = SSEManager()
        await manager.send_to_user("unknown-user", {"type": "noop"})  # must not raise

    @pytest.mark.asyncio
    async def test_multiple_messages_are_ordered(self):
        """Messages arrive in FIFO order within a single queue."""
        manager = SSEManager()
        queue = await manager.add_connection("user-1")

        await manager.send_to_user("user-1", {"seq": 1})
        await manager.send_to_user("user-1", {"seq": 2})
        await manager.send_to_user("user-1", {"seq": 3})

        assert queue.get_nowait() == {"seq": 1}
        assert queue.get_nowait() == {"seq": 2}
        assert queue.get_nowait() == {"seq": 3}
