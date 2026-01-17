"""Tests for system router."""

import os
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from src.main import create_application


@pytest.fixture
def app_with_container():
    """Create an app with a container for testing."""
    app = create_application()
    return app


@pytest.fixture
def client_with_container(app_with_container: FastAPI):
    """Create a test client with container."""
    return TestClient(app_with_container)


class TestHealthEndpointWithDatabase:
    """Test enhanced health check endpoint with database connectivity."""

    def test_health_endpoint_database_connected(
        self, app_with_container: FastAPI
    ) -> None:
        """Health endpoint should return healthy when database is connected."""
        client = TestClient(app_with_container)

        # Mock the database and ping command
        with patch(
            "src.presentation.api.routers.system.container.database"
        ) as mock_db_service:
            mock_db_service.return_value.db.command = AsyncMock(return_value=None)

            response = client.get("/api/v1/health")

            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "healthy"
            assert "version" in data
            assert data["database"] == "connected"

    def test_health_endpoint_database_disconnected(
        self, app_with_container: FastAPI
    ) -> None:
        """Health endpoint should return unhealthy when database is disconnected."""
        client = TestClient(app_with_container)

        # Mock the database to raise an error
        with patch("src.presentation.api.routers.system.container") as mock_container:
            mock_db_service = MagicMock()
            mock_db_service.db.command = AsyncMock(
                side_effect=ConnectionError("Connection failed")
            )
            mock_container.database.return_value = mock_db_service
            mock_container.telegram_notification_service.return_value = MagicMock()

            response = client.get("/api/v1/health")

            assert response.status_code == 503
            data = response.json()
            assert data["status"] == "unhealthy"
            assert "version" in data
            assert data["database"] == "disconnected"
            assert "error" in data

    def test_health_endpoint_database_timeout(
        self, app_with_container: FastAPI
    ) -> None:
        """Health endpoint should handle database timeout gracefully."""
        client = TestClient(app_with_container)

        # Mock the database to raise a timeout error
        with patch("src.presentation.api.routers.system.container") as mock_container:
            mock_db_service = MagicMock()
            mock_db_service.db.command = AsyncMock(
                side_effect=TimeoutError("Database ping timeout")
            )
            mock_container.database.return_value = mock_db_service
            mock_container.telegram_notification_service.return_value = MagicMock()

            response = client.get("/api/v1/health")

            assert response.status_code == 503
            data = response.json()
            assert data["status"] == "unhealthy"
            assert data["database"] == "disconnected"

    def test_health_endpoint_sends_notification_on_failure(
        self, app_with_container: FastAPI
    ) -> None:
        """Health endpoint should send Telegram notification on database failure."""
        client = TestClient(app_with_container)

        # Mock the database to raise an error
        with patch("src.presentation.api.routers.system.container") as mock_container:
            mock_db_service = MagicMock()
            mock_db_service.db.command = AsyncMock(
                side_effect=ConnectionError("Connection failed")
            )
            mock_container.database.return_value = mock_db_service

            mock_telegram_service = AsyncMock()
            mock_container.telegram_notification_service.return_value = (
                mock_telegram_service
            )

            with patch.dict(os.environ, {"POD_NAME": "guidr-api-server-abc123"}):
                response = client.get("/api/v1/health")

            assert response.status_code == 503

            # Verify Telegram notification was called
            mock_telegram_service.send_health_failure_notification.assert_called_once()

    def test_health_endpoint_notification_failure_does_not_crash(
        self, app_with_container: FastAPI
    ) -> None:
        """Health endpoint should not crash if notification sending fails."""
        client = TestClient(app_with_container)

        # Mock the database to raise an error
        with patch("src.presentation.api.routers.system.container") as mock_container:
            mock_db_service = MagicMock()
            mock_db_service.db.command = AsyncMock(
                side_effect=ConnectionError("Connection failed")
            )
            mock_container.database.return_value = mock_db_service

            mock_telegram_service = AsyncMock()
            mock_telegram_service.send_health_failure_notification.side_effect = (
                Exception("Telegram service error")
            )
            mock_container.telegram_notification_service.return_value = (
                mock_telegram_service
            )

            # Should not raise an exception
            response = client.get("/api/v1/health")

            assert response.status_code == 503
            data = response.json()
            assert data["status"] == "unhealthy"

    def test_health_endpoint_version_available(
        self, app_with_container: FastAPI
    ) -> None:
        """Health endpoint should include version in all responses."""
        client = TestClient(app_with_container)

        with patch("src.presentation.api.routers.system.container") as mock_container:
            mock_db_service = MagicMock()
            mock_db_service.db.command = AsyncMock(return_value=None)
            mock_container.database.return_value = mock_db_service

            response = client.get("/api/v1/health")

            data = response.json()
            assert "version" in data
            assert data["version"] is not None
