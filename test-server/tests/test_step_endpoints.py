import pytest
from httpx import AsyncClient
import uuid


class TestGetSteps:
    """Test GET /steps endpoint"""

    @pytest.mark.asyncio
    async def test_get_steps_empty(self, test_client: AsyncClient):
        """Should return empty list when no steps exist"""
        response = await test_client.get("/steps")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    @pytest.mark.asyncio
    async def test_get_steps_single(self, test_client: AsyncClient, seeded_step):
        """Should return list with single step"""
        response = await test_client.get("/steps")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == seeded_step["id"]
        assert data[0]["title"] == seeded_step["title"]
        assert data[0]["guideId"] == seeded_step["guide_id"]
        assert data[0]["order"] == seeded_step["order"]
        assert data[0]["duration"] == seeded_step["duration"]

    @pytest.mark.asyncio
    async def test_get_steps_multiple(self, test_client: AsyncClient, multiple_steps):
        """Should return all steps"""
        response = await test_client.get("/steps")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3


class TestGetStepById:
    """Test GET /steps/{step_id} endpoint"""

    @pytest.mark.asyncio
    async def test_get_step_success(self, test_client: AsyncClient, seeded_step):
        """Should return step by ID"""
        response = await test_client.get(f"/steps/{seeded_step['id']}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == seeded_step["id"]
        assert data["title"] == seeded_step["title"]
        assert data["guideId"] == seeded_step["guide_id"]
        assert data["order"] == seeded_step["order"]
        assert data["duration"] == seeded_step["duration"]
        assert data["description"] == seeded_step.get("description")
        assert "createdAt" in data
        assert "updatedAt" in data

    @pytest.mark.asyncio
    async def test_get_step_not_found(self, test_client: AsyncClient):
        """Should return 404 for nonexistent step"""
        nonexistent_id = str(uuid.uuid4())
        response = await test_client.get(f"/steps/{nonexistent_id}")

        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert nonexistent_id in data["detail"]


class TestGetStepsByGuide:
    """Test GET /steps/guide/{guide_id} endpoint"""

    @pytest.mark.asyncio
    async def test_get_steps_by_guide_success(self, test_client: AsyncClient, multiple_steps, seeded_guide):
        """Should return steps for given guide"""
        response = await test_client.get(f"/steps/guide/{seeded_guide['id']}")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        assert all(step["guideId"] == seeded_guide["id"] for step in data)

    @pytest.mark.asyncio
    async def test_get_steps_by_guide_ordered(self, test_client: AsyncClient, multiple_steps, seeded_guide):
        """Should return steps in order"""
        response = await test_client.get(f"/steps/guide/{seeded_guide['id']}")

        assert response.status_code == 200
        data = response.json()

        # Verify steps are sorted by order
        orders = [step["order"] for step in data]
        assert orders == sorted(orders)
        assert orders == [1, 2, 3]

    @pytest.mark.asyncio
    async def test_get_steps_by_nonexistent_guide(self, test_client: AsyncClient):
        """Should return empty list for nonexistent guide"""
        nonexistent_id = str(uuid.uuid4())
        response = await test_client.get(f"/steps/guide/{nonexistent_id}")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 0

    @pytest.mark.asyncio
    async def test_get_steps_filters_by_guide(self, test_client: AsyncClient, mock_mongodb_database):
        """Should only return steps matching the guide"""
        # Create two guides
        from datetime import datetime
        category_id = str(uuid.uuid4())
        await mock_mongodb_database.categories.insert_one({
            "id": category_id,
            "name": "Test Category",
            "parent_id": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })

        guide1_id = str(uuid.uuid4())
        guide2_id = str(uuid.uuid4())

        await mock_mongodb_database.guides.insert_many([
            {
                "id": guide1_id,
                "category_id": category_id,
                "title": "Guide 1",
                "description": None,
                "step_ids": [],
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            },
            {
                "id": guide2_id,
                "category_id": category_id,
                "title": "Guide 2",
                "description": None,
                "step_ids": [],
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        ])

        # Create steps in each guide
        await mock_mongodb_database.steps.insert_many([
            {
                "id": str(uuid.uuid4()),
                "guide_id": guide1_id,
                "order": 1,
                "title": "Step in Guide 1",
                "description": None,
                "duration": 30,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "guide_id": guide2_id,
                "order": 1,
                "title": "Step in Guide 2",
                "description": None,
                "duration": 30,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        ])

        # Get steps for guide 1
        response = await test_client.get(f"/steps/guide/{guide1_id}")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["title"] == "Step in Guide 1"


class TestCreateStep:
    """Test POST /steps endpoint"""

    @pytest.mark.asyncio
    async def test_create_step_success(self, test_client: AsyncClient, seeded_guide):
        """Should create step successfully"""
        step_id = str(uuid.uuid4())
        response = await test_client.post(
            "/steps",
            json={
                "id": step_id,
                "guideId": seeded_guide["id"],
                "order": 1,
                "title": "New Test Step",
                "description": "Test Step Description",
                "duration": 60,
                "createdAt": "2024-01-01T00:00:00",
                "updatedAt": "2024-01-01T00:00:00"
            }
        )

        assert response.status_code == 201
        data = response.json()
        assert data["id"] == step_id
        assert data["title"] == "New Test Step"
        assert data["guideId"] == seeded_guide["id"]
        assert data["order"] == 1
        assert data["duration"] == 60
        assert data["description"] == "Test Step Description"

    @pytest.mark.asyncio
    async def test_create_step_without_description(self, test_client: AsyncClient, seeded_guide):
        """Should create step without description"""
        step_id = str(uuid.uuid4())
        response = await test_client.post(
            "/steps",
            json={
                "id": step_id,
                "guideId": seeded_guide["id"],
                "order": 1,
                "title": "Step Without Description",
                "duration": 30,
                "createdAt": "2024-01-01T00:00:00",
                "updatedAt": "2024-01-01T00:00:00"
            }
        )

        assert response.status_code == 201
        data = response.json()
        assert data["description"] is None

    @pytest.mark.asyncio
    async def test_create_step_persists(self, test_client: AsyncClient, seeded_guide):
        """Should persist created step in database"""
        step_id = str(uuid.uuid4())
        await test_client.post(
            "/steps",
            json={
                "id": step_id,
                "guideId": seeded_guide["id"],
                "order": 1,
                "title": "Persisted Step",
                "description": "Persisted Description",
                "duration": 45,
                "createdAt": "2024-01-01T00:00:00",
                "updatedAt": "2024-01-01T00:00:00"
            }
        )

        # Verify it's retrievable
        get_response = await test_client.get(f"/steps/{step_id}")
        assert get_response.status_code == 200
        assert get_response.json()["title"] == "Persisted Step"

    @pytest.mark.asyncio
    async def test_create_step_missing_title(self, test_client: AsyncClient, seeded_guide):
        """Should reject step without title"""
        response = await test_client.post(
            "/steps",
            json={
                "id": str(uuid.uuid4()),
                "guideId": seeded_guide["id"],
                "order": 1,
                "duration": 30,
                "createdAt": "2024-01-01T00:00:00",
                "updatedAt": "2024-01-01T00:00:00"
            }
        )

        assert response.status_code == 422  # Validation error

    @pytest.mark.asyncio
    async def test_create_step_missing_duration(self, test_client: AsyncClient, seeded_guide):
        """Should reject step without duration"""
        response = await test_client.post(
            "/steps",
            json={
                "id": str(uuid.uuid4()),
                "guideId": seeded_guide["id"],
                "order": 1,
                "title": "Step Without Duration",
                "createdAt": "2024-01-01T00:00:00",
                "updatedAt": "2024-01-01T00:00:00"
            }
        )

        assert response.status_code == 422  # Validation error


class TestUpdateStep:
    """Test PUT /steps/{step_id} endpoint"""

    @pytest.mark.asyncio
    async def test_update_step_success(self, test_client: AsyncClient, seeded_step):
        """Should update step successfully"""
        updated_title = "Updated Step Title"
        updated_duration = 120

        response = await test_client.put(
            f"/steps/{seeded_step['id']}",
            json={
                "id": seeded_step["id"],
                "guideId": seeded_step["guide_id"],
                "order": seeded_step["order"],
                "title": updated_title,
                "description": seeded_step.get("description"),
                "duration": updated_duration,
                "createdAt": seeded_step["created_at"].isoformat(),
                "updatedAt": "2024-12-31T23:59:59"
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == seeded_step["id"]
        assert data["title"] == updated_title
        assert data["duration"] == updated_duration

    @pytest.mark.asyncio
    async def test_update_step_order(self, test_client: AsyncClient, seeded_step):
        """Should allow updating step order"""
        new_order = 5

        response = await test_client.put(
            f"/steps/{seeded_step['id']}",
            json={
                "id": seeded_step["id"],
                "guideId": seeded_step["guide_id"],
                "order": new_order,
                "title": seeded_step["title"],
                "description": seeded_step.get("description"),
                "duration": seeded_step["duration"],
                "createdAt": seeded_step["created_at"].isoformat(),
                "updatedAt": "2024-12-31T23:59:59"
            }
        )

        assert response.status_code == 200
        assert response.json()["order"] == new_order

    @pytest.mark.asyncio
    async def test_update_step_persists(self, test_client: AsyncClient, seeded_step):
        """Should persist updated step in database"""
        updated_title = "Persisted Updated Title"

        await test_client.put(
            f"/steps/{seeded_step['id']}",
            json={
                "id": seeded_step["id"],
                "guideId": seeded_step["guide_id"],
                "order": seeded_step["order"],
                "title": updated_title,
                "description": seeded_step.get("description"),
                "duration": seeded_step["duration"],
                "createdAt": seeded_step["created_at"].isoformat(),
                "updatedAt": "2024-12-31T23:59:59"
            }
        )

        # Verify update persisted
        get_response = await test_client.get(f"/steps/{seeded_step['id']}")
        assert get_response.status_code == 200
        assert get_response.json()["title"] == updated_title

    @pytest.mark.asyncio
    async def test_update_step_not_found(self, test_client: AsyncClient, seeded_guide):
        """Should return 404 when updating nonexistent step"""
        nonexistent_id = str(uuid.uuid4())
        response = await test_client.put(
            f"/steps/{nonexistent_id}",
            json={
                "id": nonexistent_id,
                "guideId": seeded_guide["id"],
                "order": 1,
                "title": "Updated Title",
                "description": None,
                "duration": 30,
                "createdAt": "2024-01-01T00:00:00",
                "updatedAt": "2024-12-31T23:59:59"
            }
        )

        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert nonexistent_id in data["detail"]


class TestDeleteStep:
    """Test DELETE /steps/{step_id} endpoint"""

    @pytest.mark.asyncio
    async def test_delete_step_success(self, test_client: AsyncClient, seeded_step):
        """Should delete step successfully"""
        response = await test_client.delete(f"/steps/{seeded_step['id']}")

        assert response.status_code == 204
        assert response.content == b""

    @pytest.mark.asyncio
    async def test_delete_step_removes_from_database(self, test_client: AsyncClient, seeded_step):
        """Should remove step from database"""
        # Delete step
        delete_response = await test_client.delete(f"/steps/{seeded_step['id']}")
        assert delete_response.status_code == 204

        # Verify it's gone
        get_response = await test_client.get(f"/steps/{seeded_step['id']}")
        assert get_response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_step_not_found(self, test_client: AsyncClient):
        """Should return 404 when deleting nonexistent step"""
        nonexistent_id = str(uuid.uuid4())
        response = await test_client.delete(f"/steps/{nonexistent_id}")

        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert nonexistent_id in data["detail"]
