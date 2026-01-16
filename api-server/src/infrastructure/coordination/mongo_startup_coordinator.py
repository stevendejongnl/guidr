"""MongoDB-based coordinator for startup notifications across replicas."""

import logging
from datetime import UTC, datetime, timedelta

from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)


class MongoStartupCoordinator:
    """Coordinates startup notifications using MongoDB atomic operations.

    Uses findOneAndUpdate with upsert to atomically acquire a distributed lock.
    The first pod to insert the document gets to send the notification.
    """

    COLLECTION_NAME = "startup_locks"
    LOCK_TTL_MINUTES = 5

    def __init__(self, database: AsyncIOMotorDatabase):
        """Initialize coordinator.

        Args:
            database: MongoDB async database instance
        """
        self._database = database

    async def ensure_indexes(self) -> None:
        """Ensure required database indexes exist.

        Creates a TTL index that auto-deletes expired locks after 5 minutes.
        """
        collection = self._database[self.COLLECTION_NAME]

        try:
            # Create TTL index that removes documents 5 minutes after creation
            await collection.create_index(
                "expiresAt",
                expireAfterSeconds=0,  # Delete when document reaches expiresAt
            )
            logger.info("Ensured TTL index on startup_locks collection")
        except Exception as e:
            logger.warning(f"Failed to create TTL index: {e}")

    async def should_send_startup_notification(self, deployment_id: str) -> bool:
        """Check if this instance should send the startup notification.

        Atomically attempts to insert a lock document. The first instance to
        insert succeeds (returns True), others get the existing document (returns False).

        Uses MongoDB's atomic findOneAndUpdate with upsert=True to handle
        race conditions. If the operation inserts a new document, we acquired
        the lock. If it finds an existing document, someone else has the lock.

        Args:
            deployment_id: Unique identifier for the deployment

        Returns:
            True if lock was acquired (new document inserted), False otherwise
        """
        collection = self._database[self.COLLECTION_NAME]

        try:
            now = datetime.now(UTC)
            expires_at = now + timedelta(minutes=self.LOCK_TTL_MINUTES)

            # Atomic operation: try to acquire lock
            # This operation is atomic at the database level
            result = await collection.find_one_and_update(
                {"_id": deployment_id},
                {
                    "$setOnInsert": {
                        "_id": deployment_id,
                        "acquiredAt": now,
                        "expiresAt": expires_at,
                    }
                },
                upsert=True,
                return_document=False,  # Return OLD document if it exists
            )

            # If result is None, the document was inserted (we got the lock)
            # If result contains a document, it already existed (lock taken)
            acquired = result is None

            if acquired:
                logger.info(
                    f"Acquired startup notification lock for deployment: {deployment_id}"
                )
            else:
                logger.info(
                    f"Startup notification lock already acquired for deployment: "
                    f"{deployment_id}"
                )

            return acquired

        except Exception as e:
            # Graceful degradation: allow notification on coordination failure
            # Better to send duplicate than to miss critical alerts
            logger.warning(
                f"Failed to coordinate startup notification for {deployment_id}: {e}. "
                f"Allowing notification to proceed."
            )
            return True
