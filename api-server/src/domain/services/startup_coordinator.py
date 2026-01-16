"""Domain service for coordinating startup notifications across replicas."""

from typing import Protocol


class IStartupCoordinator(Protocol):
    """Protocol for startup notification coordination.

    Coordinates startup notifications across multiple replicas to prevent
    duplicate messages during deployment.
    """

    async def ensure_indexes(self) -> None:
        """Ensure required database indexes exist."""
        ...

    async def should_send_startup_notification(self, deployment_id: str) -> bool:
        """Check if this instance should send the startup notification.

        The first instance to acquire the lock returns True, others return False.
        Gracefully degrades to True on coordination failures.

        Args:
            deployment_id: Unique identifier for the deployment

        Returns:
            True if this instance should send notification, False otherwise
        """
        ...
