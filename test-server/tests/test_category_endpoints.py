import pytest
from httpx import AsyncClient
import uuid


class TestGetCategories:
    """Test GET /categories endpoint"""

    @pytest.mark.asyncio
    async def test_get_categories_empty(self, test_client: AsyncClient):
        """Should return empty list when no categories exist"""
        response = await test_client.get("/categories")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    @pytest.mark.asyncio
    async def test_get_categories_single(self, test_client: AsyncClient, seeded_category):
        """Should return list with single category"""
        response = await test_client.get("/categories")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == seeded_category["id"]
        assert data[0]["name"] == seeded_category["name"]

    @pytest.mark.asyncio
    async def test_get_categories_multiple(self, test_client: AsyncClient, multiple_categories):
        """Should return all categories"""
        response = await test_client.get("/categories")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3  # 1 parent + 2 children


class TestGetCategoryById:
    """Test GET /categories/{category_id} endpoint"""

    @pytest.mark.asyncio
    async def test_get_category_success(self, test_client: AsyncClient, seeded_category):
        """Should return category by ID"""
        response = await test_client.get(f"/categories/{seeded_category['id']}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == seeded_category["id"]
        assert data["name"] == seeded_category["name"]
        assert data["parentId"] == seeded_category.get("parent_id")
        assert "createdAt" in data
        assert "updatedAt" in data

    @pytest.mark.asyncio
    async def test_get_category_not_found(self, test_client: AsyncClient):
        """Should return 404 for nonexistent category"""
        nonexistent_id = str(uuid.uuid4())
        response = await test_client.get(f"/categories/{nonexistent_id}")

        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert nonexistent_id in data["detail"]


class TestGetCategoriesByParent:
    """Test GET /categories/parent/{parent_id} endpoint"""

    @pytest.mark.asyncio
    async def test_get_root_categories(self, test_client: AsyncClient, multiple_categories):
        """Should return root categories when parent_id is 'null'"""
        response = await test_client.get("/categories/parent/null")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["parentId"] is None
        assert data[0]["name"] == "Parent Category"

    @pytest.mark.asyncio
    async def test_get_child_categories(self, test_client: AsyncClient, multiple_categories):
        """Should return child categories for given parent"""
        parent_id = multiple_categories["parent"]["id"]
        response = await test_client.get(f"/categories/parent/{parent_id}")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert all(cat["parentId"] == parent_id for cat in data)

    @pytest.mark.asyncio
    async def test_get_categories_by_nonexistent_parent(self, test_client: AsyncClient):
        """Should return empty list for nonexistent parent"""
        nonexistent_id = str(uuid.uuid4())
        response = await test_client.get(f"/categories/parent/{nonexistent_id}")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 0


class TestCreateCategory:
    """Test POST /categories endpoint"""

    @pytest.mark.asyncio
    async def test_create_root_category_success(self, test_client: AsyncClient):
        """Should create root category successfully"""
        category_id = str(uuid.uuid4())
        response = await test_client.post(
            "/categories",
            json={
                "id": category_id,
                "name": "New Root Category",
                "parentId": None,
                "createdAt": "2024-01-01T00:00:00",
                "updatedAt": "2024-01-01T00:00:00"
            }
        )

        assert response.status_code == 201
        data = response.json()
        assert data["id"] == category_id
        assert data["name"] == "New Root Category"
        assert data["parentId"] is None

    @pytest.mark.asyncio
    async def test_create_child_category_success(self, test_client: AsyncClient, seeded_category):
        """Should create child category successfully"""
        child_id = str(uuid.uuid4())
        response = await test_client.post(
            "/categories",
            json={
                "id": child_id,
                "name": "Child Category",
                "parentId": seeded_category["id"],
                "createdAt": "2024-01-01T00:00:00",
                "updatedAt": "2024-01-01T00:00:00"
            }
        )

        assert response.status_code == 201
        data = response.json()
        assert data["id"] == child_id
        assert data["parentId"] == seeded_category["id"]

    @pytest.mark.asyncio
    async def test_create_category_persists(self, test_client: AsyncClient):
        """Should persist created category in database"""
        category_id = str(uuid.uuid4())
        await test_client.post(
            "/categories",
            json={
                "id": category_id,
                "name": "Persisted Category",
                "parentId": None,
                "createdAt": "2024-01-01T00:00:00",
                "updatedAt": "2024-01-01T00:00:00"
            }
        )

        # Verify it's retrievable
        get_response = await test_client.get(f"/categories/{category_id}")
        assert get_response.status_code == 200
        assert get_response.json()["name"] == "Persisted Category"

    @pytest.mark.asyncio
    async def test_create_category_missing_name(self, test_client: AsyncClient):
        """Should reject category without name"""
        response = await test_client.post(
            "/categories",
            json={
                "id": str(uuid.uuid4()),
                "parentId": None,
                "createdAt": "2024-01-01T00:00:00",
                "updatedAt": "2024-01-01T00:00:00"
            }
        )

        assert response.status_code == 422  # Validation error


class TestUpdateCategory:
    """Test PUT /categories/{category_id} endpoint"""

    @pytest.mark.asyncio
    async def test_update_category_success(self, test_client: AsyncClient, seeded_category):
        """Should update category successfully"""
        updated_name = "Updated Category Name"
        response = await test_client.put(
            f"/categories/{seeded_category['id']}",
            json={
                "id": seeded_category["id"],
                "name": updated_name,
                "parentId": seeded_category.get("parent_id"),
                "createdAt": seeded_category["created_at"].isoformat(),
                "updatedAt": "2024-12-31T23:59:59"
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == seeded_category["id"]
        assert data["name"] == updated_name

    @pytest.mark.asyncio
    async def test_update_category_persists(self, test_client: AsyncClient, seeded_category):
        """Should persist updated category in database"""
        updated_name = "Persisted Updated Name"
        await test_client.put(
            f"/categories/{seeded_category['id']}",
            json={
                "id": seeded_category["id"],
                "name": updated_name,
                "parentId": seeded_category.get("parent_id"),
                "createdAt": seeded_category["created_at"].isoformat(),
                "updatedAt": "2024-12-31T23:59:59"
            }
        )

        # Verify update persisted
        get_response = await test_client.get(f"/categories/{seeded_category['id']}")
        assert get_response.status_code == 200
        assert get_response.json()["name"] == updated_name

    @pytest.mark.asyncio
    async def test_update_category_not_found(self, test_client: AsyncClient):
        """Should return 404 when updating nonexistent category"""
        nonexistent_id = str(uuid.uuid4())
        response = await test_client.put(
            f"/categories/{nonexistent_id}",
            json={
                "id": nonexistent_id,
                "name": "Updated Name",
                "parentId": None,
                "createdAt": "2024-01-01T00:00:00",
                "updatedAt": "2024-12-31T23:59:59"
            }
        )

        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert nonexistent_id in data["detail"]

    @pytest.mark.asyncio
    async def test_update_category_change_parent(self, test_client: AsyncClient, multiple_categories):
        """Should allow changing category parent"""
        child = multiple_categories["children"][0]
        new_parent_id = str(uuid.uuid4())

        # Create new parent
        await test_client.post(
            "/categories",
            json={
                "id": new_parent_id,
                "name": "New Parent",
                "parentId": None,
                "createdAt": "2024-01-01T00:00:00",
                "updatedAt": "2024-01-01T00:00:00"
            }
        )

        # Update child to have new parent
        response = await test_client.put(
            f"/categories/{child['id']}",
            json={
                "id": child["id"],
                "name": child["name"],
                "parentId": new_parent_id,
                "createdAt": child["created_at"].isoformat(),
                "updatedAt": "2024-12-31T23:59:59"
            }
        )

        assert response.status_code == 200
        assert response.json()["parentId"] == new_parent_id


class TestDeleteCategory:
    """Test DELETE /categories/{category_id} endpoint"""

    @pytest.mark.asyncio
    async def test_delete_category_success(self, test_client: AsyncClient, seeded_category):
        """Should delete category successfully"""
        response = await test_client.delete(f"/categories/{seeded_category['id']}")

        assert response.status_code == 204
        assert response.content == b""

    @pytest.mark.asyncio
    async def test_delete_category_removes_from_database(self, test_client: AsyncClient, seeded_category):
        """Should remove category from database"""
        # Delete category
        delete_response = await test_client.delete(f"/categories/{seeded_category['id']}")
        assert delete_response.status_code == 204

        # Verify it's gone
        get_response = await test_client.get(f"/categories/{seeded_category['id']}")
        assert get_response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_category_not_found(self, test_client: AsyncClient):
        """Should return 404 when deleting nonexistent category"""
        nonexistent_id = str(uuid.uuid4())
        response = await test_client.delete(f"/categories/{nonexistent_id}")

        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert nonexistent_id in data["detail"]

    @pytest.mark.asyncio
    async def test_delete_parent_with_children(self, test_client: AsyncClient, multiple_categories):
        """Should allow deleting parent category (orphaning children)"""
        parent_id = multiple_categories["parent"]["id"]
        response = await test_client.delete(f"/categories/{parent_id}")

        assert response.status_code == 204

        # Children still exist but orphaned
        get_response = await test_client.get("/categories")
        categories = get_response.json()
        assert len(categories) == 2  # Only children remain
