import pytest
from httpx import AsyncClient
import uuid


class TestCompleteWorkflows:
    """Test complete end-to-end workflows"""

    @pytest.mark.asyncio
    async def test_full_guide_creation_workflow(self, test_client: AsyncClient):
        """Should create category, guide, and steps in sequence"""
        # Create category
        category_id = str(uuid.uuid4())
        category_response = await test_client.post(
            "/categories",
            json={
                "id": category_id,
                "name": "Workflow Category",
                "parentId": None,
                "createdAt": "2024-01-01T00:00:00",
                "updatedAt": "2024-01-01T00:00:00"
            }
        )
        assert category_response.status_code == 201

        # Create guide in that category
        guide_id = str(uuid.uuid4())
        guide_response = await test_client.post(
            "/guides",
            json={
                "id": guide_id,
                "categoryId": category_id,
                "title": "Workflow Guide",
                "description": "Complete workflow test",
                "stepIds": [],
                "createdAt": "2024-01-01T00:00:00",
                "updatedAt": "2024-01-01T00:00:00"
            }
        )
        assert guide_response.status_code == 201

        # Create multiple steps for the guide
        step_ids = []
        for i in range(3):
            step_id = str(uuid.uuid4())
            step_response = await test_client.post(
                "/steps",
                json={
                    "id": step_id,
                    "guideId": guide_id,
                    "order": i + 1,
                    "title": f"Step {i + 1}",
                    "description": f"Step {i + 1} description",
                    "duration": 30 * (i + 1),
                    "createdAt": "2024-01-01T00:00:00",
                    "updatedAt": "2024-01-01T00:00:00"
                }
            )
            assert step_response.status_code == 201
            step_ids.append(step_id)

        # Verify guide has steps
        steps_response = await test_client.get(f"/steps/guide/{guide_id}")
        assert steps_response.status_code == 200
        steps = steps_response.json()
        assert len(steps) == 3
        assert [s["order"] for s in steps] == [1, 2, 3]

    @pytest.mark.asyncio
    async def test_session_lifecycle_workflow(self, test_client: AsyncClient):
        """Should create and manage a session through its lifecycle"""
        # Setup: Create category, guide, and steps
        category_id = str(uuid.uuid4())
        await test_client.post(
            "/categories",
            json={
                "id": category_id,
                "name": "Session Category",
                "parentId": None,
                "createdAt": "2024-01-01T00:00:00",
                "updatedAt": "2024-01-01T00:00:00"
            }
        )

        guide_id = str(uuid.uuid4())
        await test_client.post(
            "/guides",
            json={
                "id": guide_id,
                "categoryId": category_id,
                "title": "Session Guide",
                "stepIds": [],
                "createdAt": "2024-01-01T00:00:00",
                "updatedAt": "2024-01-01T00:00:00"
            }
        )

        # Create session
        session_id = str(uuid.uuid4())
        create_response = await test_client.post(
            "/sessions",
            json={
                "id": session_id,
                "guideId": guide_id,
                "status": "NotStarted",
                "startedAt": None,
                "completedAt": None,
                "currentStepId": None,
                "createdAt": "2024-01-01T00:00:00",
                "updatedAt": "2024-01-01T00:00:00"
            }
        )
        assert create_response.status_code == 201
        assert create_response.json()["status"] == "NotStarted"

        # Start session
        start_response = await test_client.put(
            f"/sessions/{session_id}",
            json={
                "id": session_id,
                "guideId": guide_id,
                "status": "InProgress",
                "startedAt": "2024-01-01T10:00:00",
                "completedAt": None,
                "currentStepId": None,
                "createdAt": "2024-01-01T00:00:00",
                "updatedAt": "2024-01-01T10:00:00"
            }
        )
        assert start_response.status_code == 200
        assert start_response.json()["status"] == "InProgress"

        # Pause session
        pause_response = await test_client.put(
            f"/sessions/{session_id}",
            json={
                "id": session_id,
                "guideId": guide_id,
                "status": "Paused",
                "startedAt": "2024-01-01T10:00:00",
                "completedAt": None,
                "currentStepId": None,
                "createdAt": "2024-01-01T00:00:00",
                "updatedAt": "2024-01-01T10:30:00"
            }
        )
        assert pause_response.status_code == 200
        assert pause_response.json()["status"] == "Paused"

        # Resume session
        resume_response = await test_client.put(
            f"/sessions/{session_id}",
            json={
                "id": session_id,
                "guideId": guide_id,
                "status": "InProgress",
                "startedAt": "2024-01-01T10:00:00",
                "completedAt": None,
                "currentStepId": None,
                "createdAt": "2024-01-01T00:00:00",
                "updatedAt": "2024-01-01T10:45:00"
            }
        )
        assert resume_response.status_code == 200
        assert resume_response.json()["status"] == "InProgress"

        # Complete session
        complete_response = await test_client.put(
            f"/sessions/{session_id}",
            json={
                "id": session_id,
                "guideId": guide_id,
                "status": "Completed",
                "startedAt": "2024-01-01T10:00:00",
                "completedAt": "2024-01-01T11:00:00",
                "currentStepId": None,
                "createdAt": "2024-01-01T00:00:00",
                "updatedAt": "2024-01-01T11:00:00"
            }
        )
        assert complete_response.status_code == 200
        assert complete_response.json()["status"] == "Completed"
        assert complete_response.json()["completedAt"] == "2024-01-01T11:00:00"

    @pytest.mark.asyncio
    async def test_authentication_and_data_access_workflow(self, test_client: AsyncClient):
        """Should register, login, and access data"""
        # Register new user
        register_response = await test_client.post(
            "/register",
            json={
                "email": "workflow@example.com",
                "password": "securepassword123"
            }
        )
        assert register_response.status_code == 201
        register_data = register_response.json()
        assert "token" in register_data
        assert register_data["email"] == "workflow@example.com"

        # Login with same credentials
        login_response = await test_client.post(
            "/login",
            json={
                "email": "workflow@example.com",
                "password": "securepassword123"
            }
        )
        assert login_response.status_code == 200
        login_data = login_response.json()
        assert "token" in login_data

        # Access data (tokens aren't validated in test server, but we verify flow works)
        categories_response = await test_client.get("/categories")
        assert categories_response.status_code == 200

    @pytest.mark.asyncio
    async def test_hierarchical_category_workflow(self, test_client: AsyncClient):
        """Should create parent and child categories"""
        # Create parent category
        parent_id = str(uuid.uuid4())
        parent_response = await test_client.post(
            "/categories",
            json={
                "id": parent_id,
                "name": "Parent Category",
                "parentId": None,
                "createdAt": "2024-01-01T00:00:00",
                "updatedAt": "2024-01-01T00:00:00"
            }
        )
        assert parent_response.status_code == 201

        # Create child categories
        child1_id = str(uuid.uuid4())
        child1_response = await test_client.post(
            "/categories",
            json={
                "id": child1_id,
                "name": "Child Category 1",
                "parentId": parent_id,
                "createdAt": "2024-01-01T00:00:00",
                "updatedAt": "2024-01-01T00:00:00"
            }
        )
        assert child1_response.status_code == 201

        child2_id = str(uuid.uuid4())
        child2_response = await test_client.post(
            "/categories",
            json={
                "id": child2_id,
                "name": "Child Category 2",
                "parentId": parent_id,
                "createdAt": "2024-01-01T00:00:00",
                "updatedAt": "2024-01-01T00:00:00"
            }
        )
        assert child2_response.status_code == 201

        # Verify hierarchy
        root_categories = await test_client.get("/categories/parent/null")
        assert root_categories.status_code == 200
        root_data = root_categories.json()
        assert len(root_data) == 1
        assert root_data[0]["id"] == parent_id

        child_categories = await test_client.get(f"/categories/parent/{parent_id}")
        assert child_categories.status_code == 200
        child_data = child_categories.json()
        assert len(child_data) == 2
        assert {c["id"] for c in child_data} == {child1_id, child2_id}

    @pytest.mark.asyncio
    async def test_multi_guide_session_workflow(self, test_client: AsyncClient):
        """Should handle multiple sessions for different guides"""
        # Create category and multiple guides
        category_id = str(uuid.uuid4())
        await test_client.post(
            "/categories",
            json={
                "id": category_id,
                "name": "Multi-Guide Category",
                "parentId": None,
                "createdAt": "2024-01-01T00:00:00",
                "updatedAt": "2024-01-01T00:00:00"
            }
        )

        guide1_id = str(uuid.uuid4())
        guide2_id = str(uuid.uuid4())

        await test_client.post(
            "/guides",
            json={
                "id": guide1_id,
                "categoryId": category_id,
                "title": "Guide 1",
                "stepIds": [],
                "createdAt": "2024-01-01T00:00:00",
                "updatedAt": "2024-01-01T00:00:00"
            }
        )

        await test_client.post(
            "/guides",
            json={
                "id": guide2_id,
                "categoryId": category_id,
                "title": "Guide 2",
                "stepIds": [],
                "createdAt": "2024-01-01T00:00:00",
                "updatedAt": "2024-01-01T00:00:00"
            }
        )

        # Create sessions for each guide
        session1_id = str(uuid.uuid4())
        session2_id = str(uuid.uuid4())

        await test_client.post(
            "/sessions",
            json={
                "id": session1_id,
                "guideId": guide1_id,
                "status": "InProgress",
                "startedAt": "2024-01-01T00:00:00",
                "completedAt": None,
                "currentStepId": None,
                "createdAt": "2024-01-01T00:00:00",
                "updatedAt": "2024-01-01T00:00:00"
            }
        )

        await test_client.post(
            "/sessions",
            json={
                "id": session2_id,
                "guideId": guide2_id,
                "status": "Completed",
                "startedAt": "2024-01-01T00:00:00",
                "completedAt": "2024-01-01T01:00:00",
                "currentStepId": None,
                "createdAt": "2024-01-01T00:00:00",
                "updatedAt": "2024-01-01T01:00:00"
            }
        )

        # Verify sessions by guide
        guide1_sessions = await test_client.get(f"/sessions/guide/{guide1_id}")
        assert guide1_sessions.status_code == 200
        assert len(guide1_sessions.json()) == 1
        assert guide1_sessions.json()[0]["status"] == "InProgress"

        guide2_sessions = await test_client.get(f"/sessions/guide/{guide2_id}")
        assert guide2_sessions.status_code == 200
        assert len(guide2_sessions.json()) == 1
        assert guide2_sessions.json()[0]["status"] == "Completed"

        # Verify sessions by status
        in_progress = await test_client.get("/sessions/status/InProgress")
        assert in_progress.status_code == 200
        assert len(in_progress.json()) == 1

        completed = await test_client.get("/sessions/status/Completed")
        assert completed.status_code == 200
        assert len(completed.json()) == 1

    @pytest.mark.asyncio
    async def test_cascade_deletion_workflow(self, test_client: AsyncClient):
        """Should handle deletion of related entities"""
        # Create full hierarchy
        category_id = str(uuid.uuid4())
        await test_client.post(
            "/categories",
            json={
                "id": category_id,
                "name": "Delete Category",
                "parentId": None,
                "createdAt": "2024-01-01T00:00:00",
                "updatedAt": "2024-01-01T00:00:00"
            }
        )

        guide_id = str(uuid.uuid4())
        await test_client.post(
            "/guides",
            json={
                "id": guide_id,
                "categoryId": category_id,
                "title": "Delete Guide",
                "stepIds": [],
                "createdAt": "2024-01-01T00:00:00",
                "updatedAt": "2024-01-01T00:00:00"
            }
        )

        step_id = str(uuid.uuid4())
        await test_client.post(
            "/steps",
            json={
                "id": step_id,
                "guideId": guide_id,
                "order": 1,
                "title": "Delete Step",
                "duration": 30,
                "createdAt": "2024-01-01T00:00:00",
                "updatedAt": "2024-01-01T00:00:00"
            }
        )

        session_id = str(uuid.uuid4())
        await test_client.post(
            "/sessions",
            json={
                "id": session_id,
                "guideId": guide_id,
                "status": "NotStarted",
                "startedAt": None,
                "completedAt": None,
                "currentStepId": None,
                "createdAt": "2024-01-01T00:00:00",
                "updatedAt": "2024-01-01T00:00:00"
            }
        )

        # Delete category (leaves guide/step/session orphaned)
        delete_category = await test_client.delete(f"/categories/{category_id}")
        assert delete_category.status_code == 204

        # Verify guide still exists (no cascade delete)
        get_guide = await test_client.get(f"/guides/{guide_id}")
        assert get_guide.status_code == 200

        # Delete guide
        delete_guide = await test_client.delete(f"/guides/{guide_id}")
        assert delete_guide.status_code == 204

        # Delete step
        delete_step = await test_client.delete(f"/steps/{step_id}")
        assert delete_step.status_code == 204

        # Delete session
        delete_session = await test_client.delete(f"/sessions/{session_id}")
        assert delete_session.status_code == 204

        # Verify all deleted
        assert (await test_client.get(f"/categories/{category_id}")).status_code == 404
        assert (await test_client.get(f"/guides/{guide_id}")).status_code == 404
        assert (await test_client.get(f"/steps/{step_id}")).status_code == 404
        assert (await test_client.get(f"/sessions/{session_id}")).status_code == 404
