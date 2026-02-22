"""Pytest configuration and fixtures for integration tests."""

import os
import socket
from collections.abc import AsyncGenerator
from urllib.parse import urlparse

import pytest
from httpx import ASGITransport, AsyncClient
from motor.motor_asyncio import AsyncIOMotorDatabase

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


@pytest.fixture
async def app():
    """Create a test FastAPI application."""
    # Use test database
    mongo_uri = os.getenv("MONGO_TEST_URI", "mongodb://localhost:27017/guidr_test")
    if not _mongodb_is_reachable(mongo_uri):
        pytest.fail(
            f"MongoDB is not reachable at {mongo_uri}. "
            "Integration tests require a running MongoDB instance. "
            "Start one with: docker run -d -p 27017:27017 mongo"
        )
    os.environ["MONGO_URI"] = mongo_uri

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
