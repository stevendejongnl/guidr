"""Pytest configuration and fixtures for integration tests."""

import os
import socket
import subprocess
import time
from collections.abc import AsyncGenerator, Generator
from urllib.parse import urlparse

import pytest
from httpx import ASGITransport, AsyncClient
from motor.motor_asyncio import AsyncIOMotorDatabase
from testcontainers.mongodb import MongoDbContainer

from src.infrastructure.config.settings import get_settings
from src.main import create_application


def _mongodb_is_reachable(uri: str, timeout: float = 2.0) -> bool:
    """Check if MongoDB is reachable with a quick TCP connection check."""
    parsed = urlparse(uri)
    host = parsed.hostname or "localhost"
    port = parsed.port or 27017
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except OSError:
        return False


def _ensure_docker_running(max_wait: int = 30) -> None:
    """Start Docker daemon if not running and wait until it's ready."""
    result = subprocess.run(
        ["docker", "info"],
        capture_output=True,
        timeout=5,
    )
    if result.returncode == 0:
        return

    subprocess.run(["open", "-a", "Docker"], check=True)

    for _ in range(max_wait):
        time.sleep(1)
        result = subprocess.run(
            ["docker", "info"],
            capture_output=True,
            timeout=5,
        )
        if result.returncode == 0:
            return

    msg = f"Docker daemon did not start within {max_wait}s"
    raise RuntimeError(msg)


def _cleanup_stale_containers() -> None:
    """Remove stale testcontainers (Ryuk reaper + MongoDB) from previous runs."""
    for image in ("testcontainers/ryuk", "mongo:7.0"):
        ids = subprocess.run(
            ["docker", "ps", "-aq", "--filter", f"ancestor={image}"],
            capture_output=True,
            text=True,
        ).stdout.split()
        if ids:
            subprocess.run(["docker", "rm", "-f", *ids], capture_output=True)


@pytest.fixture(scope="session")
def mongo_uri() -> Generator[str, None, None]:
    """Provide a MongoDB URI for integration tests.

    Uses a locally running instance if available (respects MONGO_TEST_URI env var),
    otherwise starts Docker if needed and launches a temporary MongoDB container.
    """
    configured_uri = os.getenv("MONGO_TEST_URI", "mongodb://localhost:27017/guidr_test")
    if _mongodb_is_reachable(configured_uri):
        yield configured_uri
        return

    _ensure_docker_running()
    _cleanup_stale_containers()

    # Disable Ryuk reaper to avoid 409 Conflict when container name already
    # exists from a previous run. We handle cleanup ourselves above.
    os.environ["TESTCONTAINERS_RYUK_DISABLED"] = "true"

    # Retry once after cleanup if the first container start fails.
    for attempt in range(2):
        try:
            with MongoDbContainer("mongo:7.0") as container:
                yield f"{container.get_connection_url()}/guidr_test"
                return
        except Exception:
            if attempt == 0:
                _cleanup_stale_containers()
            else:
                raise


@pytest.fixture
async def app(mongo_uri: str):
    """Create a test FastAPI application."""
    parsed = urlparse(mongo_uri)
    db_name = parsed.path.lstrip("/") or "guidr_test"
    base_url = f"{parsed.scheme}://{parsed.netloc}"

    os.environ["MONGODB_URL"] = base_url
    os.environ["MONGODB_DATABASE"] = db_name
    get_settings.cache_clear()

    application = create_application()

    # Connect to test database
    container = application.state.container
    db_instance = container.database()
    await db_instance.connect()

    # Clear test data before each test
    test_db = db_instance.db
    await test_db.users.delete_many({})
    await test_db.guides.delete_many({})

    yield application

    # Cleanup: disconnect
    await db_instance.disconnect()


@pytest.fixture
async def client(app) -> AsyncGenerator[AsyncClient, None]:
    """Create an async HTTP client for testing."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as test_client:
        yield test_client


@pytest.fixture
async def db(app) -> AsyncGenerator[AsyncIOMotorDatabase, None]:
    """Get the test database instance."""
    container = app.state.container
    database = container.database()
    yield database.db


@pytest.fixture
async def auth_headers(client: AsyncClient) -> dict[str, str]:
    """Get auth headers for a test user."""
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": "test@example.com", "password": "password123"},
    )
    if response.status_code == 409:  # User already exists
        response = await client.post(
            "/api/v1/auth/login",
            data={"username": "test@example.com", "password": "password123"},
        )
    data = response.json()
    token = data.get("accessToken") or data.get("access_token")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def admin_headers(client: AsyncClient, db: AsyncIOMotorDatabase) -> dict[str, str]:
    """Get auth headers for an admin user."""
    # First, register the admin user
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": "admin@example.com", "password": "password123"},
    )
    if response.status_code == 409:  # User already exists
        response = await client.post(
            "/api/v1/auth/login",
            data={"username": "admin@example.com", "password": "password123"},
        )

    data = response.json()
    token = data.get("accessToken") or data.get("access_token")

    # Make the user an admin by updating their role in database
    user_doc = await db.users.find_one({"email": "admin@example.com"})
    if user_doc:
        await db.users.update_one(
            {"_id": user_doc["_id"]},
            {"$set": {"role": "admin"}}
        )

    return {"Authorization": f"Bearer {token}"}
