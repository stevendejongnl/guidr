"""Tests for MigrationRunner."""

from datetime import UTC, datetime
from unittest.mock import AsyncMock

import pytest
from motor.motor_asyncio import AsyncIOMotorDatabase

from .migration_runner import MigrationRunner
from .migrations import migrate_guides_add_ownership_fields


@pytest.fixture
def mock_db():
    """Create a mock database."""
    db = AsyncMock(spec=AsyncIOMotorDatabase)
    migrations_collection = AsyncMock()
    db.__getitem__.return_value = migrations_collection
    return db, migrations_collection


class TestMigrationRunner:
    """Test suite for MigrationRunner."""

    @pytest.mark.asyncio
    async def test_run_new_migration(
        self, mock_db: tuple[AsyncMock, AsyncMock]
    ) -> None:
        """Test running a new migration that hasn't been executed before."""
        db, migrations_collection = mock_db
        migrations_collection.find_one.return_value = None

        runner = MigrationRunner(db)

        # Mock migration function
        migration_func = AsyncMock()

        await runner.run_migrations([("test_migration", migration_func)])

        # Verify migration was executed
        migration_func.assert_called_once_with(db)

        # Verify migration was marked as complete
        migrations_collection.insert_one.assert_called_once()
        call_args = migrations_collection.insert_one.call_args[0][0]
        assert call_args["_id"] == "test_migration"
        assert "completed_at" in call_args
        assert isinstance(call_args["completed_at"], datetime)

    @pytest.mark.asyncio
    async def test_skip_completed_migration(
        self, mock_db: tuple[AsyncMock, AsyncMock]
    ) -> None:
        """Test that completed migrations are skipped."""
        db, migrations_collection = mock_db
        migrations_collection.find_one.return_value = {
            "_id": "completed_migration",
            "completed_at": datetime.now(UTC),
        }

        runner = MigrationRunner(db)
        migration_func = AsyncMock()

        await runner.run_migrations([("completed_migration", migration_func)])

        # Verify migration was NOT executed
        migration_func.assert_not_called()

        # Verify migration was NOT marked as complete again
        migrations_collection.insert_one.assert_not_called()

    @pytest.mark.asyncio
    async def test_run_multiple_migrations(
        self, mock_db: tuple[AsyncMock, AsyncMock]
    ) -> None:
        """Test running multiple migrations in order."""
        db, migrations_collection = mock_db

        # First migration is new, second is completed
        migrations_collection.find_one.side_effect = [
            None,  # First migration not found
            {"_id": "migration_2", "completed_at": datetime.now(UTC)},  # Second found
            None,  # Third not found
        ]

        runner = MigrationRunner(db)

        migration_1 = AsyncMock()
        migration_2 = AsyncMock()
        migration_3 = AsyncMock()

        await runner.run_migrations(
            [
                ("migration_1", migration_1),
                ("migration_2", migration_2),
                ("migration_3", migration_3),
            ]
        )

        # Verify only migrations 1 and 3 were executed
        migration_1.assert_called_once()
        migration_2.assert_not_called()
        migration_3.assert_called_once()

        # Verify migrations were marked complete (2 calls)
        assert migrations_collection.insert_one.call_count == 2

    @pytest.mark.asyncio
    async def test_migration_failure_raises_exception(
        self, mock_db: tuple[AsyncMock, AsyncMock]
    ) -> None:
        """Test that migration failures raise exceptions."""
        db, migrations_collection = mock_db
        migrations_collection.find_one.return_value = None

        runner = MigrationRunner(db)

        # Mock migration function that raises an exception
        migration_func = AsyncMock(side_effect=ValueError("Migration failed"))

        with pytest.raises(ValueError, match="Migration failed"):
            await runner.run_migrations([("failing_migration", migration_func)])

        # Verify migration was NOT marked as complete
        migrations_collection.insert_one.assert_not_called()


class TestMigrateGuidesAddOwnershipFields:
    """Tests for the migrate_guides_add_ownership_fields migration function."""

    async def test_backfills_missing_ownership_fields(self) -> None:
        """Guides missing ownership fields receive null/false defaults."""
        db = AsyncMock(spec=AsyncIOMotorDatabase)
        guides_collection = AsyncMock()
        db.__getitem__.return_value = guides_collection

        await migrate_guides_add_ownership_fields(db)

        guides_collection.update_many.assert_called_once()
        filter_arg, update_arg = guides_collection.update_many.call_args[0]

        # Filter targets guides missing any of the three fields
        assert "$or" in filter_arg
        assert "createdByUserId" in filter_arg["$or"][0]
        assert "isPublic" in filter_arg["$or"][1]
        assert "isHighlighted" in filter_arg["$or"][2]

        # Update sets safe defaults: no owner, private, not highlighted
        set_fields = update_arg["$set"]
        assert set_fields["createdByUserId"] is None
        assert set_fields["isPublic"] is False
        assert set_fields["isHighlighted"] is False

    async def test_uses_exists_false_filter(self) -> None:
        """Filter uses $exists: False to target legacy documents."""
        db = AsyncMock(spec=AsyncIOMotorDatabase)
        guides_collection = AsyncMock()
        db.__getitem__.return_value = guides_collection

        await migrate_guides_add_ownership_fields(db)

        filter_arg = guides_collection.update_many.call_args[0][0]
        for condition in filter_arg["$or"]:
            for field_filter in condition.values():
                assert field_filter == {"$exists": False}
