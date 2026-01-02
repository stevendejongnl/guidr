import pytest
from httpx import AsyncClient
import uuid


class TestGetGuides:
    """Test GET /guides endpoint"""

    @pytest.mark.asyncio
    async def test_get_guides_empty(self, test_client: AsyncClient):
        """Should return empty list when no guides exist"""
        response = await test_client.get("/guides")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    @pytest.mark.asyncio
    async def test_get_guides_single(self, test_client: AsyncClient, seeded_guide):
        """Should return list with single guide"""
        response = await test_client.get("/guides")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == seeded_guide["id"]
        assert data[0]["title"] == seeded_guide["title"]
        assert data[0]["categoryId"] == seeded_guide["category_id"]

    @pytest.mark.asyncio
    async def test_get_guides_multiple(self, test_client: AsyncClient, multiple_guides):
        """Should return all guides"""
        response = await test_client.get("/guides")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3


class TestGetGuideById:
    """Test GET /guides/{guide_id} endpoint"""

    @pytest.mark.asyncio
    async def test_get_guide_success(self, test_client: AsyncClient, seeded_guide):
        """Should return guide by ID"""
        response = await test_client.get(f"/guides/{seeded_guide['id']}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == seeded_guide["id"]
        assert data["title"] == seeded_guide["title"]
        assert data["categoryId"] == seeded_guide["category_id"]
        assert data["description"] == seeded_guide.get("description")
        assert data["stepIds"] == seeded_guide.get("step_ids", [])
        assert "createdAt" in data
        assert "updatedAt" in data

    @pytest.mark.asyncio
    async def test_get_guide_not_found(self, test_client: AsyncClient):
        """Should return 404 for nonexistent guide"""
        nonexistent_id = str(uuid.uuid4())
        response = await test_client.get(f"/guides/{nonexistent_id}")

        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert nonexistent_id in data["detail"]


class TestGetGuidesByCategory:
    """Test GET /guides/category/{category_id} endpoint"""

    @pytest.mark.asyncio
    async def test_get_guides_by_category_success(self, test_client: AsyncClient, multiple_guides, seeded_category):
        """Should return guides for given category"""
        response = await test_client.get(f"/guides/category/{seeded_category['id']}")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        assert all(guide["categoryId"] == seeded_category["id"] for guide in data)

    @pytest.mark.asyncio
    async def test_get_guides_by_nonexistent_category(self, test_client: AsyncClient):
        """Should return empty list for nonexistent category"""
        nonexistent_id = str(uuid.uuid4())
        response = await test_client.get(f"/guides/category/{nonexistent_id}")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 0

    @pytest.mark.asyncio
    async def test_get_guides_filters_by_category(self, test_client: AsyncClient, mock_mongodb_database):
        """Should only return guides matching the category"""
        # Create two categories
        category1_id = str(uuid.uuid4())
        category2_id = str(uuid.uuid4())

        await mock_mongodb_database.categories.insert_many([
            {
                "id": category1_id,
                "name": "Category 1",
                "parent_id": None,
                "created_at": "2024-01-01T00:00:00",
                "updated_at": "2024-01-01T00:00:00"
            },
            {
                "id": category2_id,
                "name": "Category 2",
                "parent_id": None,
                "created_at": "2024-01-01T00:00:00",
                "updated_at": "2024-01-01T00:00:00"
            }
        ])

        # Create guides in each category
        await mock_mongodb_database.guides.insert_many([
            {
                "id": str(uuid.uuid4()),
                "category_id": category1_id,
                "title": "Guide in Category 1",
                "description": None,
                "step_ids": [],
                "created_at": "2024-01-01T00:00:00",
                "updated_at": "2024-01-01T00:00:00"
            },
            {
                "id": str(uuid.uuid4()),
                "category_id": category2_id,
                "title": "Guide in Category 2",
                "description": None,
                "step_ids": [],
                "created_at": "2024-01-01T00:00:00",
                "updated_at": "2024-01-01T00:00:00"
            }
        ])

        # Get guides for category 1
        response = await test_client.get(f"/guides/category/{category1_id}")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["title"] == "Guide in Category 1"


class TestCreateGuide:
    """Test POST /guides endpoint"""

    @pytest.mark.asyncio
    async def test_create_guide_success(self, test_client: AsyncClient, seeded_category):
        """Should create guide successfully"""
        guide_id = str(uuid.uuid4())
        response = await test_client.post(
            "/guides",
            json={
                "id": guide_id,
                "categoryId": seeded_category["id"],
                "title": "New Test Guide",
                "description": "Test Description",
                "stepIds": [],
                "createdAt": "2024-01-01T00:00:00",
                "updatedAt": "2024-01-01T00:00:00"
            }
        )

        assert response.status_code == 201
        data = response.json()
        assert data["id"] == guide_id
        assert data["title"] == "New Test Guide"
        assert data["categoryId"] == seeded_category["id"]
        assert data["description"] == "Test Description"
        assert data["stepIds"] == []

    @pytest.mark.asyncio
    async def test_create_guide_without_description(self, test_client: AsyncClient, seeded_category):
        """Should create guide without description"""
        guide_id = str(uuid.uuid4())
        response = await test_client.post(
            "/guides",
            json={
                "id": guide_id,
                "categoryId": seeded_category["id"],
                "title": "Guide Without Description",
                "stepIds": [],
                "createdAt": "2024-01-01T00:00:00",
                "updatedAt": "2024-01-01T00:00:00"
            }
        )

        assert response.status_code == 201
        data = response.json()
        assert data["description"] is None

    @pytest.mark.asyncio
    async def test_create_guide_persists(self, test_client: AsyncClient, seeded_category):
        """Should persist created guide in database"""
        guide_id = str(uuid.uuid4())
        await test_client.post(
            "/guides",
            json={
                "id": guide_id,
                "categoryId": seeded_category["id"],
                "title": "Persisted Guide",
                "description": "Persisted Description",
                "stepIds": [],
                "createdAt": "2024-01-01T00:00:00",
                "updatedAt": "2024-01-01T00:00:00"
            }
        )

        # Verify it's retrievable
        get_response = await test_client.get(f"/guides/{guide_id}")
        assert get_response.status_code == 200
        assert get_response.json()["title"] == "Persisted Guide"

    @pytest.mark.asyncio
    async def test_create_guide_missing_title(self, test_client: AsyncClient, seeded_category):
        """Should reject guide without title"""
        response = await test_client.post(
            "/guides",
            json={
                "id": str(uuid.uuid4()),
                "categoryId": seeded_category["id"],
                "stepIds": [],
                "createdAt": "2024-01-01T00:00:00",
                "updatedAt": "2024-01-01T00:00:00"
            }
        )

        assert response.status_code == 422  # Validation error

    @pytest.mark.asyncio
    async def test_create_guide_missing_category_id(self, test_client: AsyncClient):
        """Should reject guide without category ID"""
        response = await test_client.post(
            "/guides",
            json={
                "id": str(uuid.uuid4()),
                "title": "Guide Without Category",
                "stepIds": [],
                "createdAt": "2024-01-01T00:00:00",
                "updatedAt": "2024-01-01T00:00:00"
            }
        )

        assert response.status_code == 422  # Validation error


class TestUpdateGuide:
    """Test PUT /guides/{guide_id} endpoint"""

    @pytest.mark.asyncio
    async def test_update_guide_success(self, test_client: AsyncClient, seeded_guide):
        """Should update guide successfully"""
        updated_title = "Updated Guide Title"
        updated_description = "Updated Description"

        response = await test_client.put(
            f"/guides/{seeded_guide['id']}",
            json={
                "id": seeded_guide["id"],
                "categoryId": seeded_guide["category_id"],
                "title": updated_title,
                "description": updated_description,
                "stepIds": seeded_guide.get("step_ids", []),
                "createdAt": seeded_guide["created_at"].isoformat(),
                "updatedAt": "2024-12-31T23:59:59"
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == seeded_guide["id"]
        assert data["title"] == updated_title
        assert data["description"] == updated_description

    @pytest.mark.asyncio
    async def test_update_guide_persists(self, test_client: AsyncClient, seeded_guide):
        """Should persist updated guide in database"""
        updated_title = "Persisted Updated Title"

        await test_client.put(
            f"/guides/{seeded_guide['id']}",
            json={
                "id": seeded_guide["id"],
                "categoryId": seeded_guide["category_id"],
                "title": updated_title,
                "description": seeded_guide.get("description"),
                "stepIds": seeded_guide.get("step_ids", []),
                "createdAt": seeded_guide["created_at"].isoformat(),
                "updatedAt": "2024-12-31T23:59:59"
            }
        )

        # Verify update persisted
        get_response = await test_client.get(f"/guides/{seeded_guide['id']}")
        assert get_response.status_code == 200
        assert get_response.json()["title"] == updated_title

    @pytest.mark.asyncio
    async def test_update_guide_not_found(self, test_client: AsyncClient, seeded_category):
        """Should return 404 when updating nonexistent guide"""
        nonexistent_id = str(uuid.uuid4())
        response = await test_client.put(
            f"/guides/{nonexistent_id}",
            json={
                "id": nonexistent_id,
                "categoryId": seeded_category["id"],
                "title": "Updated Title",
                "description": None,
                "stepIds": [],
                "createdAt": "2024-01-01T00:00:00",
                "updatedAt": "2024-12-31T23:59:59"
            }
        )

        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert nonexistent_id in data["detail"]

    @pytest.mark.asyncio
    async def test_update_guide_change_category(self, test_client: AsyncClient, seeded_guide, mock_mongodb_database):
        """Should allow changing guide category"""
        # Create new category
        new_category_id = str(uuid.uuid4())
        await mock_mongodb_database.categories.insert_one({
            "id": new_category_id,
            "name": "New Category",
            "parent_id": None,
            "created_at": "2024-01-01T00:00:00",
            "updated_at": "2024-01-01T00:00:00"
        })

        # Update guide to new category
        response = await test_client.put(
            f"/guides/{seeded_guide['id']}",
            json={
                "id": seeded_guide["id"],
                "categoryId": new_category_id,
                "title": seeded_guide["title"],
                "description": seeded_guide.get("description"),
                "stepIds": seeded_guide.get("step_ids", []),
                "createdAt": seeded_guide["created_at"].isoformat(),
                "updatedAt": "2024-12-31T23:59:59"
            }
        )

        assert response.status_code == 200
        assert response.json()["categoryId"] == new_category_id


class TestDeleteGuide:
    """Test DELETE /guides/{guide_id} endpoint"""

    @pytest.mark.asyncio
    async def test_delete_guide_success(self, test_client: AsyncClient, seeded_guide):
        """Should delete guide successfully"""
        response = await test_client.delete(f"/guides/{seeded_guide['id']}")

        assert response.status_code == 204
        assert response.content == b""

    @pytest.mark.asyncio
    async def test_delete_guide_removes_from_database(self, test_client: AsyncClient, seeded_guide):
        """Should remove guide from database"""
        # Delete guide
        delete_response = await test_client.delete(f"/guides/{seeded_guide['id']}")
        assert delete_response.status_code == 204

        # Verify it's gone
        get_response = await test_client.get(f"/guides/{seeded_guide['id']}")
        assert get_response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_guide_not_found(self, test_client: AsyncClient):
        """Should return 404 when deleting nonexistent guide"""
        nonexistent_id = str(uuid.uuid4())
        response = await test_client.delete(f"/guides/{nonexistent_id}")

        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert nonexistent_id in data["detail"]
