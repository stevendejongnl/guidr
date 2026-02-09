"""Migration runner for automatic database migrations on startup."""

import logging
from collections.abc import Callable, Coroutine
from datetime import UTC, datetime
from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

MigrationFunc = Callable[[AsyncIOMotorDatabase], Coroutine[Any, Any, None]]


class MigrationRunner:
    """Manages and runs database migrations on startup."""

    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        """Initialize migration runner.

        Args:
            db: MongoDB database instance
        """
        self._db = db
        self._migrations_collection = db["_migrations"]

    async def run_migrations(
        self, migrations: list[tuple[str, MigrationFunc]]
    ) -> None:
        """Run all pending migrations.

        Args:
            migrations: List of (migration_id, migration_function) tuples
        """
        logger.info("Checking for pending migrations...")

        for migration_id, migration_func in migrations:
            if await self._is_migration_complete(migration_id):
                logger.debug(f"Migration '{migration_id}' already completed")
                continue

            logger.info(f"Running migration: {migration_id}")
            try:
                await migration_func(self._db)
                await self._mark_migration_complete(migration_id)
                logger.info(f"Migration '{migration_id}' completed successfully")
            except Exception as e:
                logger.error(f"Migration '{migration_id}' failed: {e}")
                raise

        logger.info("All migrations completed")

    async def _is_migration_complete(self, migration_id: str) -> bool:
        """Check if a migration has already been run.

        Args:
            migration_id: Unique identifier for the migration

        Returns:
            True if migration is complete, False otherwise
        """
        result = await self._migrations_collection.find_one(
            {"_id": migration_id}
        )
        return result is not None

    async def _mark_migration_complete(self, migration_id: str) -> None:
        """Mark a migration as complete.

        Args:
            migration_id: Unique identifier for the migration
        """
        await self._migrations_collection.insert_one(
            {
                "_id": migration_id,
                "completed_at": datetime.now(UTC),
            }
        )
