"""Tests for MongoDB startup coordinator."""

from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, patch

import pytest

from .mongo_startup_coordinator import MongoStartupCoordinator


class TestMongoStartupCoordinator:
    """Test suite for MongoStartupCoordinator."""

    @pytest.fixture
    def mock_database(self):
        """Create a mock MongoDB database."""
        return AsyncMock()

    @pytest.fixture
    def coordinator(self, mock_database):
        """Create coordinator instance with mock database."""
        return MongoStartupCoordinator(mock_database)

    @pytest.mark.asyncio
    async def test_ensure_indexes_creates_ttl_index(self, mock_database):
        """Test that ensure_indexes creates a TTL index."""
        mock_collection = AsyncMock()
        mock_database.__getitem__.return_value = mock_collection

        coordinator = MongoStartupCoordinator(mock_database)
        await coordinator.ensure_indexes()

        # Verify collection was accessed
        mock_database.__getitem__.assert_called_with("startup_locks")

        # Verify create_index was called with TTL configuration
        mock_collection.create_index.assert_called_once()
        call_args = mock_collection.create_index.call_args
        assert call_args[0][0] == "expiresAt"
        assert call_args[1]["expireAfterSeconds"] == 0

    @pytest.mark.asyncio
    async def test_ensure_indexes_handles_existing_index(self, mock_database):
        """Test graceful handling if index already exists."""
        mock_collection = AsyncMock()
        mock_collection.create_index.side_effect = Exception("Index already exists")
        mock_database.__getitem__.return_value = mock_collection

        coordinator = MongoStartupCoordinator(mock_database)
        # Should not raise exception
        await coordinator.ensure_indexes()

    @pytest.mark.asyncio
    async def test_first_pod_acquires_lock(self, mock_database):
        """Test that first pod successfully acquires the lock."""
        mock_collection = AsyncMock()
        # findOneAndUpdate returns None when document is inserted (upsert=True)
        mock_collection.find_one_and_update.return_value = None
        mock_database.__getitem__.return_value = mock_collection

        coordinator = MongoStartupCoordinator(mock_database)
        acquired = await coordinator.should_send_startup_notification("test-deploy-1")

        assert acquired is True
        mock_collection.find_one_and_update.assert_called_once()

    @pytest.mark.asyncio
    async def test_second_pod_cannot_acquire_lock(self, mock_database):
        """Test that second pod cannot acquire existing lock."""
        mock_collection = AsyncMock()
        # findOneAndUpdate returns the old document when it already exists
        mock_collection.find_one_and_update.return_value = {
            "_id": "test-deploy-1",
            "acquiredAt": datetime.now(UTC),
            "expiresAt": datetime.now(UTC) + timedelta(minutes=5),
        }
        mock_database.__getitem__.return_value = mock_collection

        coordinator = MongoStartupCoordinator(mock_database)
        acquired = await coordinator.should_send_startup_notification("test-deploy-1")

        assert acquired is False

    @pytest.mark.asyncio
    async def test_different_deployment_ids_are_independent(self, mock_database):
        """Test that different deployment IDs can each acquire a lock."""
        mock_collection = AsyncMock()
        mock_database.__getitem__.return_value = mock_collection

        # First deployment acquires lock
        mock_collection.find_one_and_update.return_value = None
        coordinator = MongoStartupCoordinator(mock_database)
        acquired1 = await coordinator.should_send_startup_notification("deploy-1")

        assert acquired1 is True

        # Second deployment also acquires its own lock (different ID)
        mock_collection.find_one_and_update.return_value = None
        acquired2 = await coordinator.should_send_startup_notification("deploy-2")

        assert acquired2 is True

    @pytest.mark.asyncio
    async def test_lock_document_structure(self, mock_database):
        """Test that lock document has correct structure."""
        mock_collection = AsyncMock()
        mock_collection.find_one_and_update.return_value = None
        mock_database.__getitem__.return_value = mock_collection

        coordinator = MongoStartupCoordinator(mock_database)
        deployment_id = "test-deploy-id"

        with patch("infrastructure.coordination.mongo_startup_coordinator.datetime") as mock_dt:
            now = datetime.now(UTC)
            mock_dt.now.return_value = now

            await coordinator.should_send_startup_notification(deployment_id)

        # Verify the update document structure
        call_args = mock_collection.find_one_and_update.call_args
        filter_doc = call_args[0][0]
        update_doc = call_args[0][1]

        # Check filter
        assert filter_doc == {"_id": deployment_id}

        # Check update document has correct structure
        assert "$setOnInsert" in update_doc
        set_on_insert = update_doc["$setOnInsert"]
        assert set_on_insert["_id"] == deployment_id
        assert "acquiredAt" in set_on_insert
        assert "expiresAt" in set_on_insert

        # Check expiration is 5 minutes from now
        expires_at = set_on_insert["expiresAt"]
        assert expires_at == now + timedelta(minutes=5)

    @pytest.mark.asyncio
    async def test_graceful_degradation_on_database_error(self, mock_database):
        """Test that coordination failures allow notification to proceed."""
        mock_collection = AsyncMock()
        mock_collection.find_one_and_update.side_effect = Exception(
            "Database connection failed"
        )
        mock_database.__getitem__.return_value = mock_collection

        coordinator = MongoStartupCoordinator(mock_database)
        # Should return True to allow notification despite error
        acquired = await coordinator.should_send_startup_notification("test-deploy")

        assert acquired is True

    @pytest.mark.asyncio
    async def test_graceful_degradation_on_any_exception(self, mock_database):
        """Test that any exception during coordination is handled gracefully."""
        mock_collection = AsyncMock()
        mock_collection.find_one_and_update.side_effect = RuntimeError("Unexpected error")
        mock_database.__getitem__.return_value = mock_collection

        coordinator = MongoStartupCoordinator(mock_database)
        # Should return True to allow notification despite error
        acquired = await coordinator.should_send_startup_notification("test-deploy")

        assert acquired is True

    @pytest.mark.asyncio
    async def test_concurrent_lock_acquisition(self, mock_database):
        """Test behavior when multiple pods try to acquire lock simultaneously."""
        # Simulate MongoDB's atomic behavior:
        # First call returns None (lock acquired), subsequent calls return document
        mock_collection = AsyncMock()
        mock_collection.find_one_and_update.side_effect = [
            None,  # First pod gets the lock
            {  # Second pod gets existing document
                "_id": "test-deploy",
                "acquiredAt": datetime.now(UTC),
                "expiresAt": datetime.now(UTC) + timedelta(minutes=5),
            },
            {  # Third pod gets existing document
                "_id": "test-deploy",
                "acquiredAt": datetime.now(UTC),
                "expiresAt": datetime.now(UTC) + timedelta(minutes=5),
            },
        ]
        mock_database.__getitem__.return_value = mock_collection

        coordinator = MongoStartupCoordinator(mock_database)

        # First pod acquires lock
        acquired1 = await coordinator.should_send_startup_notification("test-deploy")
        assert acquired1 is True

        # Second pod cannot acquire lock
        acquired2 = await coordinator.should_send_startup_notification("test-deploy")
        assert acquired2 is False

        # Third pod also cannot acquire lock
        acquired3 = await coordinator.should_send_startup_notification("test-deploy")
        assert acquired3 is False

    @pytest.mark.asyncio
    async def test_lock_expiration_time_is_five_minutes(self, mock_database):
        """Test that lock expiration is set to 5 minutes."""
        mock_collection = AsyncMock()
        mock_collection.find_one_and_update.return_value = None
        mock_database.__getitem__.return_value = mock_collection

        coordinator = MongoStartupCoordinator(mock_database)

        start_time = datetime.now(UTC)
        await coordinator.should_send_startup_notification("test-deploy")
        end_time = datetime.now(UTC)

        call_args = mock_collection.find_one_and_update.call_args
        update_doc = call_args[0][1]
        expires_at = update_doc["$setOnInsert"]["expiresAt"]

        # Verify expiration is approximately 5 minutes from now (with small tolerance)
        expected_min = start_time + timedelta(minutes=5) - timedelta(seconds=1)
        expected_max = end_time + timedelta(minutes=5) + timedelta(seconds=1)

        assert expected_min <= expires_at <= expected_max

    @pytest.mark.asyncio
    async def test_find_one_and_update_called_with_correct_params(self, mock_database):
        """Test that find_one_and_update is called with correct parameters."""
        mock_collection = AsyncMock()
        mock_collection.find_one_and_update.return_value = None
        mock_database.__getitem__.return_value = mock_collection

        coordinator = MongoStartupCoordinator(mock_database)
        deployment_id = "test-deploy"

        await coordinator.should_send_startup_notification(deployment_id)

        # Verify the call
        call_args = mock_collection.find_one_and_update.call_args

        # Check positional arguments
        assert call_args[0][0] == {"_id": deployment_id}

        # Check keyword arguments
        assert call_args[1]["upsert"] is True
        assert call_args[1]["return_document"] is False
