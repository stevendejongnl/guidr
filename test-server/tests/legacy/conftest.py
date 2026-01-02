import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from mongomock_motor import AsyncMongoMockClient
from datetime import datetime
import uuid

# Import the server app and dependencies
import sys
from pathlib import Path

# Add parent directory to path so we can import server
sys.path.insert(0, str(Path(__file__).parent.parent))

import server


@pytest_asyncio.fixture
async def mock_mongodb_client():
    """Provide mocked MongoDB client using mongomock"""
    client = AsyncMongoMockClient()
    yield client
    client.close()


@pytest_asyncio.fixture
async def mock_mongodb_database(mock_mongodb_client):
    """Provide mocked MongoDB database"""
    database = mock_mongodb_client["guidr_test"]

    # Create indexes (similar to real server)
    await database.users.create_index("id", unique=True)
    await database.users.create_index("email", unique=True)
    await database.categories.create_index("id", unique=True)
    await database.categories.create_index("parent_id")
    await database.guides.create_index("id", unique=True)
    await database.guides.create_index("category_id")
    await database.steps.create_index("id", unique=True)
    await database.steps.create_index("guide_id")
    await database.sessions.create_index("id", unique=True)
    await database.sessions.create_index("guide_id")
    await database.sessions.create_index("status")

    yield database

    # Cleanup - drop all collections
    for collection_name in await database.list_collection_names():
        await database[collection_name].drop()


@pytest_asyncio.fixture
async def test_client(mock_mongodb_database):
    """Provide FastAPI test client with mocked database"""
    # Override the database dependency
    server.mongodb_database = mock_mongodb_database
    server.mongodb_client = mock_mongodb_database.client

    async with AsyncClient(
        transport=ASGITransport(app=server.app),
        base_url="http://test"
    ) as client:
        yield client


# Sample data fixtures

@pytest.fixture
def sample_category_data():
    """Sample category data for testing"""
    return {
        "id": str(uuid.uuid4()),
        "name": "Test Category",
        "parent_id": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }


@pytest.fixture
def sample_guide_data(sample_category_data):
    """Sample guide data for testing"""
    return {
        "id": str(uuid.uuid4()),
        "category_id": sample_category_data["id"],
        "title": "Test Guide",
        "description": "Test Description",
        "step_ids": [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }


@pytest.fixture
def sample_step_data(sample_guide_data):
    """Sample step data for testing"""
    return {
        "id": str(uuid.uuid4()),
        "guide_id": sample_guide_data["id"],
        "order": 1,
        "title": "Test Step",
        "description": "Test Step Description",
        "duration": 60,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }


@pytest.fixture
def sample_session_data(sample_guide_data):
    """Sample session data for testing"""
    return {
        "id": str(uuid.uuid4()),
        "guide_id": sample_guide_data["id"],
        "status": "NotStarted",
        "started_at": None,
        "completed_at": None,
        "current_step_id": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }


@pytest.fixture
def sample_user_data():
    """Sample user data for testing"""
    return {
        "id": str(uuid.uuid4()),
        "email": "testuser@example.com",
        "password": server.hash_password("password123"),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }


# Database-seeded fixtures

@pytest_asyncio.fixture
async def seeded_category(mock_mongodb_database, sample_category_data):
    """Create and return a category in the test database"""
    await mock_mongodb_database.categories.insert_one(sample_category_data)
    return sample_category_data


@pytest_asyncio.fixture
async def seeded_guide(mock_mongodb_database, sample_guide_data, seeded_category):
    """Create and return a guide in the test database"""
    await mock_mongodb_database.guides.insert_one(sample_guide_data)
    return sample_guide_data


@pytest_asyncio.fixture
async def seeded_step(mock_mongodb_database, sample_step_data, seeded_guide):
    """Create and return a step in the test database"""
    await mock_mongodb_database.steps.insert_one(sample_step_data)
    return sample_step_data


@pytest_asyncio.fixture
async def seeded_session(mock_mongodb_database, sample_session_data, seeded_guide):
    """Create and return a session in the test database"""
    await mock_mongodb_database.sessions.insert_one(sample_session_data)
    return sample_session_data


@pytest_asyncio.fixture
async def seeded_user(mock_mongodb_database, sample_user_data):
    """Create and return a user in the test database"""
    await mock_mongodb_database.users.insert_one(sample_user_data)
    return sample_user_data


# Authentication fixtures

@pytest_asyncio.fixture
async def auth_token(test_client):
    """Create and return an authentication token"""
    response = await test_client.post(
        "/register",
        json={
            "email": "auth@example.com",
            "password": "password123"
        }
    )
    assert response.status_code == 201
    data = response.json()
    return data["token"]


@pytest_asyncio.fixture
async def authenticated_client(test_client, auth_token):
    """Return test client with authentication header"""
    test_client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return test_client


# Multiple items fixtures

@pytest_asyncio.fixture
async def multiple_categories(mock_mongodb_database):
    """Create multiple categories for testing"""
    parent_category = {
        "id": str(uuid.uuid4()),
        "name": "Parent Category",
        "parent_id": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

    child_category_1 = {
        "id": str(uuid.uuid4()),
        "name": "Child Category 1",
        "parent_id": parent_category["id"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

    child_category_2 = {
        "id": str(uuid.uuid4()),
        "name": "Child Category 2",
        "parent_id": parent_category["id"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

    await mock_mongodb_database.categories.insert_many([
        parent_category,
        child_category_1,
        child_category_2
    ])

    return {
        "parent": parent_category,
        "children": [child_category_1, child_category_2]
    }


@pytest_asyncio.fixture
async def multiple_guides(mock_mongodb_database, seeded_category):
    """Create multiple guides for testing"""
    guides = []
    for i in range(3):
        guide = {
            "id": str(uuid.uuid4()),
            "category_id": seeded_category["id"],
            "title": f"Test Guide {i+1}",
            "description": f"Description {i+1}",
            "step_ids": [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        guides.append(guide)

    await mock_mongodb_database.guides.insert_many(guides)
    return guides


@pytest_asyncio.fixture
async def multiple_steps(mock_mongodb_database, seeded_guide):
    """Create multiple steps for testing"""
    steps = []
    for i in range(3):
        step = {
            "id": str(uuid.uuid4()),
            "guide_id": seeded_guide["id"],
            "order": i + 1,
            "title": f"Step {i+1}",
            "description": f"Step description {i+1}",
            "duration": 30 * (i + 1),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        steps.append(step)

    await mock_mongodb_database.steps.insert_many(steps)
    return steps
