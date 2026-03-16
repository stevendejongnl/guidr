"""Tests for system router."""

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from src.main import create_application
from src.presentation.api.routers import system as system_router


class FakeDatabase:
    """In-memory fake database for testing."""

    def __init__(self, *, raise_on_ping: Exception | None = None) -> None:
        self._raise_on_ping = raise_on_ping
        self.db = _FakeDb(raise_on_ping=raise_on_ping)


class _FakeDb:
    def __init__(self, *, raise_on_ping: Exception | None = None) -> None:
        self._raise_on_ping = raise_on_ping

    async def command(self, _cmd: str) -> None:
        if self._raise_on_ping is not None:
            raise self._raise_on_ping


class FakeTelegramService:
    """In-memory fake Telegram notification service."""

    def __init__(self, *, raise_on_send: Exception | None = None) -> None:
        self.calls: list[dict] = []
        self._raise_on_send = raise_on_send

    async def send_health_failure_notification(
        self,
        reason: str,
        version: str,
        pod_name: str | None = None,
    ) -> None:
        if self._raise_on_send is not None:
            raise self._raise_on_send
        self.calls.append({"reason": reason, "version": version, "pod_name": pod_name})


class FakeContainer:
    """Minimal fake DI container that satisfies the health endpoint."""

    def __init__(
        self,
        *,
        database: FakeDatabase | None = None,
        telegram_service: FakeTelegramService | None = None,
    ) -> None:
        self._database = database or FakeDatabase()
        self._telegram_service = telegram_service or FakeTelegramService()

    def database(self) -> FakeDatabase:
        return self._database

    def telegram_notification_service(self) -> FakeTelegramService:
        return self._telegram_service


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
        fake_container = FakeContainer(database=FakeDatabase())
        system_router.set_container(fake_container)  # type: ignore[arg-type]

        try:
            client = TestClient(app_with_container)
            response = client.get("/api/v1/health")

            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "healthy"
            assert "version" in data
            assert data["database"] == "connected"
        finally:
            system_router.set_container(None)  # type: ignore[arg-type]

    def test_health_endpoint_database_disconnected(
        self, app_with_container: FastAPI
    ) -> None:
        """Health endpoint should return unhealthy when database is disconnected."""
        fake_db = FakeDatabase(raise_on_ping=ConnectionError("Connection failed"))
        fake_telegram = FakeTelegramService()
        fake_container = FakeContainer(database=fake_db, telegram_service=fake_telegram)
        system_router.set_container(fake_container)  # type: ignore[arg-type]

        try:
            client = TestClient(app_with_container)
            response = client.get("/api/v1/health")

            assert response.status_code == 503
            data = response.json()
            assert data["status"] == "unhealthy"
            assert "version" in data
            assert data["database"] == "disconnected"
            assert "error" in data
        finally:
            system_router.set_container(None)  # type: ignore[arg-type]

    def test_health_endpoint_database_timeout(
        self, app_with_container: FastAPI
    ) -> None:
        """Health endpoint should handle database timeout gracefully."""
        fake_db = FakeDatabase(raise_on_ping=TimeoutError("Database ping timeout"))
        fake_container = FakeContainer(database=fake_db)
        system_router.set_container(fake_container)  # type: ignore[arg-type]

        try:
            client = TestClient(app_with_container)
            response = client.get("/api/v1/health")

            assert response.status_code == 503
            data = response.json()
            assert data["status"] == "unhealthy"
            assert data["database"] == "disconnected"
        finally:
            system_router.set_container(None)  # type: ignore[arg-type]

    def test_health_endpoint_sends_notification_on_failure(
        self, app_with_container: FastAPI
    ) -> None:
        """Health endpoint should send Telegram notification on database failure."""
        fake_db = FakeDatabase(raise_on_ping=ConnectionError("Connection failed"))
        fake_telegram = FakeTelegramService()
        fake_container = FakeContainer(database=fake_db, telegram_service=fake_telegram)
        system_router.set_container(fake_container)  # type: ignore[arg-type]

        try:
            with pytest.MonkeyPatch().context() as mp:
                mp.setenv("POD_NAME", "guidr-api-server-abc123")
                client = TestClient(app_with_container)
                response = client.get("/api/v1/health")

            assert response.status_code == 503
            assert len(fake_telegram.calls) == 1
            assert "guidr-api-server-abc123" == fake_telegram.calls[0]["pod_name"]
        finally:
            system_router.set_container(None)  # type: ignore[arg-type]

    def test_health_endpoint_notification_failure_does_not_crash(
        self, app_with_container: FastAPI
    ) -> None:
        """Health endpoint should not crash if notification sending fails."""
        fake_db = FakeDatabase(raise_on_ping=ConnectionError("Connection failed"))
        fake_telegram = FakeTelegramService(
            raise_on_send=Exception("Telegram service error")
        )
        fake_container = FakeContainer(database=fake_db, telegram_service=fake_telegram)
        system_router.set_container(fake_container)  # type: ignore[arg-type]

        try:
            client = TestClient(app_with_container)
            response = client.get("/api/v1/health")

            assert response.status_code == 503
            data = response.json()
            assert data["status"] == "unhealthy"
        finally:
            system_router.set_container(None)  # type: ignore[arg-type]

    def test_health_endpoint_version_available(
        self, app_with_container: FastAPI
    ) -> None:
        """Health endpoint should include version in all responses."""
        fake_container = FakeContainer(database=FakeDatabase())
        system_router.set_container(fake_container)  # type: ignore[arg-type]

        try:
            client = TestClient(app_with_container)
            response = client.get("/api/v1/health")

            data = response.json()
            assert "version" in data
            assert data["version"] is not None
        finally:
            system_router.set_container(None)  # type: ignore[arg-type]
