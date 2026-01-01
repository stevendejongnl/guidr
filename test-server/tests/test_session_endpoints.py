import pytest
from httpx import AsyncClient
import uuid


class TestGetSessions:
    """Test GET /sessions endpoint"""

    @pytest.mark.asyncio
    async def test_get_sessions_empty(self, test_client: AsyncClient):
        """Should return empty list when no sessions exist"""
        response = await test_client.get("/sessions")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    @pytest.mark.asyncio
    async def test_get_sessions_single(self, test_client: AsyncClient, seeded_session):
        """Should return list with single session"""
        response = await test_client.get("/sessions")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == seeded_session["id"]
        assert data[0]["guideId"] == seeded_session["guide_id"]
        assert data[0]["status"] == seeded_session["status"]


class TestGetSessionById:
    """Test GET /sessions/{session_id} endpoint"""

    @pytest.mark.asyncio
    async def test_get_session_success(self, test_client: AsyncClient, seeded_session):
        """Should return session by ID"""
        response = await test_client.get(f"/sessions/{seeded_session['id']}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == seeded_session["id"]
        assert data["guideId"] == seeded_session["guide_id"]
        assert data["status"] == seeded_session["status"]
        assert data["startedAt"] == seeded_session.get("started_at")
        assert data["completedAt"] == seeded_session.get("completed_at")
        assert data["currentStepId"] == seeded_session.get("current_step_id")
        assert "createdAt" in data
        assert "updatedAt" in data

    @pytest.mark.asyncio
    async def test_get_session_not_found(self, test_client: AsyncClient):
        """Should return 404 for nonexistent session"""
        nonexistent_id = str(uuid.uuid4())
        response = await test_client.get(f"/sessions/{nonexistent_id}")

        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert nonexistent_id in data["detail"]


class TestGetSessionsByGuide:
    """Test GET /sessions/guide/{guide_id} endpoint"""

    @pytest.mark.asyncio
    async def test_get_sessions_by_guide_success(self, test_client: AsyncClient, seeded_session, seeded_guide):
        """Should return sessions for given guide"""
        response = await test_client.get(f"/sessions/guide/{seeded_guide['id']}")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["guideId"] == seeded_guide["id"]

    @pytest.mark.asyncio
    async def test_get_sessions_by_nonexistent_guide(self, test_client: AsyncClient):
        """Should return empty list for nonexistent guide"""
        nonexistent_id = str(uuid.uuid4())
        response = await test_client.get(f"/sessions/guide/{nonexistent_id}")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 0

    @pytest.mark.asyncio
    async def test_get_sessions_filters_by_guide(self, test_client: AsyncClient, mock_mongodb_database):
        """Should only return sessions matching the guide"""
        from datetime import datetime

        # Create category and guides
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

        # Create sessions in each guide
        await mock_mongodb_database.sessions.insert_many([
            {
                "id": str(uuid.uuid4()),
                "guide_id": guide1_id,
                "status": "NotStarted",
                "started_at": None,
                "completed_at": None,
                "current_step_id": None,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "guide_id": guide2_id,
                "status": "NotStarted",
                "started_at": None,
                "completed_at": None,
                "current_step_id": None,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        ])

        # Get sessions for guide 1
        response = await test_client.get(f"/sessions/guide/{guide1_id}")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["guideId"] == guide1_id


class TestGetSessionsByStatus:
    """Test GET /sessions/status/{status} endpoint"""

    @pytest.mark.asyncio
    async def test_get_sessions_by_status_not_started(self, test_client: AsyncClient, mock_mongodb_database, seeded_guide):
        """Should return sessions with NotStarted status"""
        from datetime import datetime

        # Create sessions with different statuses
        await mock_mongodb_database.sessions.insert_many([
            {
                "id": str(uuid.uuid4()),
                "guide_id": seeded_guide["id"],
                "status": "NotStarted",
                "started_at": None,
                "completed_at": None,
                "current_step_id": None,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "guide_id": seeded_guide["id"],
                "status": "InProgress",
                "started_at": "2024-01-01T00:00:00",
                "completed_at": None,
                "current_step_id": None,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        ])

        response = await test_client.get("/sessions/status/NotStarted")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["status"] == "NotStarted"

    @pytest.mark.asyncio
    async def test_get_sessions_by_status_completed(self, test_client: AsyncClient, mock_mongodb_database, seeded_guide):
        """Should return sessions with Completed status"""
        from datetime import datetime

        await mock_mongodb_database.sessions.insert_many([
            {
                "id": str(uuid.uuid4()),
                "guide_id": seeded_guide["id"],
                "status": "Completed",
                "started_at": "2024-01-01T00:00:00",
                "completed_at": "2024-01-01T01:00:00",
                "current_step_id": None,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "guide_id": seeded_guide["id"],
                "status": "Cancelled",
                "started_at": "2024-01-01T00:00:00",
                "completed_at": "2024-01-01T00:30:00",
                "current_step_id": None,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        ])

        response = await test_client.get("/sessions/status/Completed")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["status"] == "Completed"

    @pytest.mark.asyncio
    async def test_get_sessions_by_all_statuses(self, test_client: AsyncClient, mock_mongodb_database, seeded_guide):
        """Should filter correctly for all status values"""
        from datetime import datetime

        # Create one session for each status
        statuses = ["NotStarted", "InProgress", "Paused", "Completed", "Cancelled"]
        for status in statuses:
            await mock_mongodb_database.sessions.insert_one({
                "id": str(uuid.uuid4()),
                "guide_id": seeded_guide["id"],
                "status": status,
                "started_at": None if status == "NotStarted" else "2024-01-01T00:00:00",
                "completed_at": "2024-01-01T01:00:00" if status in ["Completed", "Cancelled"] else None,
                "current_step_id": None,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            })

        # Verify each status filter works
        for status in statuses:
            response = await test_client.get(f"/sessions/status/{status}")
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 1
            assert data[0]["status"] == status


class TestCreateSession:
    """Test POST /sessions endpoint"""

    @pytest.mark.asyncio
    async def test_create_session_success(self, test_client: AsyncClient, seeded_guide):
        """Should create session successfully"""
        session_id = str(uuid.uuid4())
        response = await test_client.post(
            "/sessions",
            json={
                "id": session_id,
                "guideId": seeded_guide["id"],
                "status": "NotStarted",
                "startedAt": None,
                "completedAt": None,
                "currentStepId": None,
                "createdAt": "2024-01-01T00:00:00",
                "updatedAt": "2024-01-01T00:00:00"
            }
        )

        assert response.status_code == 201
        data = response.json()
        assert data["id"] == session_id
        assert data["guideId"] == seeded_guide["id"]
        assert data["status"] == "NotStarted"
        assert data["startedAt"] is None
        assert data["completedAt"] is None
        assert data["currentStepId"] is None

    @pytest.mark.asyncio
    async def test_create_session_with_in_progress_status(self, test_client: AsyncClient, seeded_guide):
        """Should create session with InProgress status"""
        session_id = str(uuid.uuid4())
        response = await test_client.post(
            "/sessions",
            json={
                "id": session_id,
                "guideId": seeded_guide["id"],
                "status": "InProgress",
                "startedAt": "2024-01-01T00:00:00",
                "completedAt": None,
                "currentStepId": None,
                "createdAt": "2024-01-01T00:00:00",
                "updatedAt": "2024-01-01T00:00:00"
            }
        )

        assert response.status_code == 201
        data = response.json()
        assert data["status"] == "InProgress"
        assert data["startedAt"] == "2024-01-01T00:00:00"

    @pytest.mark.asyncio
    async def test_create_session_persists(self, test_client: AsyncClient, seeded_guide):
        """Should persist created session in database"""
        session_id = str(uuid.uuid4())
        await test_client.post(
            "/sessions",
            json={
                "id": session_id,
                "guideId": seeded_guide["id"],
                "status": "NotStarted",
                "startedAt": None,
                "completedAt": None,
                "currentStepId": None,
                "createdAt": "2024-01-01T00:00:00",
                "updatedAt": "2024-01-01T00:00:00"
            }
        )

        # Verify it's retrievable
        get_response = await test_client.get(f"/sessions/{session_id}")
        assert get_response.status_code == 200
        assert get_response.json()["status"] == "NotStarted"

    @pytest.mark.asyncio
    async def test_create_session_missing_guide_id(self, test_client: AsyncClient):
        """Should reject session without guide ID"""
        response = await test_client.post(
            "/sessions",
            json={
                "id": str(uuid.uuid4()),
                "status": "NotStarted",
                "startedAt": None,
                "completedAt": None,
                "currentStepId": None,
                "createdAt": "2024-01-01T00:00:00",
                "updatedAt": "2024-01-01T00:00:00"
            }
        )

        assert response.status_code == 422  # Validation error


class TestUpdateSession:
    """Test PUT /sessions/{session_id} endpoint"""

    @pytest.mark.asyncio
    async def test_update_session_status(self, test_client: AsyncClient, seeded_session):
        """Should update session status"""
        response = await test_client.put(
            f"/sessions/{seeded_session['id']}",
            json={
                "id": seeded_session["id"],
                "guideId": seeded_session["guide_id"],
                "status": "InProgress",
                "startedAt": "2024-01-01T00:00:00",
                "completedAt": None,
                "currentStepId": None,
                "createdAt": seeded_session["created_at"].isoformat(),
                "updatedAt": "2024-12-31T23:59:59"
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "InProgress"
        assert data["startedAt"] == "2024-01-01T00:00:00"

    @pytest.mark.asyncio
    async def test_update_session_to_completed(self, test_client: AsyncClient, seeded_session):
        """Should update session to Completed status"""
        response = await test_client.put(
            f"/sessions/{seeded_session['id']}",
            json={
                "id": seeded_session["id"],
                "guideId": seeded_session["guide_id"],
                "status": "Completed",
                "startedAt": "2024-01-01T00:00:00",
                "completedAt": "2024-01-01T01:00:00",
                "currentStepId": None,
                "createdAt": seeded_session["created_at"].isoformat(),
                "updatedAt": "2024-12-31T23:59:59"
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "Completed"
        assert data["completedAt"] == "2024-01-01T01:00:00"

    @pytest.mark.asyncio
    async def test_update_session_current_step(self, test_client: AsyncClient, seeded_session):
        """Should update current step ID"""
        step_id = str(uuid.uuid4())

        response = await test_client.put(
            f"/sessions/{seeded_session['id']}",
            json={
                "id": seeded_session["id"],
                "guideId": seeded_session["guide_id"],
                "status": "InProgress",
                "startedAt": "2024-01-01T00:00:00",
                "completedAt": None,
                "currentStepId": step_id,
                "createdAt": seeded_session["created_at"].isoformat(),
                "updatedAt": "2024-12-31T23:59:59"
            }
        )

        assert response.status_code == 200
        assert response.json()["currentStepId"] == step_id

    @pytest.mark.asyncio
    async def test_update_session_persists(self, test_client: AsyncClient, seeded_session):
        """Should persist updated session in database"""
        await test_client.put(
            f"/sessions/{seeded_session['id']}",
            json={
                "id": seeded_session["id"],
                "guideId": seeded_session["guide_id"],
                "status": "Paused",
                "startedAt": "2024-01-01T00:00:00",
                "completedAt": None,
                "currentStepId": None,
                "createdAt": seeded_session["created_at"].isoformat(),
                "updatedAt": "2024-12-31T23:59:59"
            }
        )

        # Verify update persisted
        get_response = await test_client.get(f"/sessions/{seeded_session['id']}")
        assert get_response.status_code == 200
        assert get_response.json()["status"] == "Paused"

    @pytest.mark.asyncio
    async def test_update_session_not_found(self, test_client: AsyncClient, seeded_guide):
        """Should return 404 when updating nonexistent session"""
        nonexistent_id = str(uuid.uuid4())
        response = await test_client.put(
            f"/sessions/{nonexistent_id}",
            json={
                "id": nonexistent_id,
                "guideId": seeded_guide["id"],
                "status": "NotStarted",
                "startedAt": None,
                "completedAt": None,
                "currentStepId": None,
                "createdAt": "2024-01-01T00:00:00",
                "updatedAt": "2024-12-31T23:59:59"
            }
        )

        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert nonexistent_id in data["detail"]


class TestDeleteSession:
    """Test DELETE /sessions/{session_id} endpoint"""

    @pytest.mark.asyncio
    async def test_delete_session_success(self, test_client: AsyncClient, seeded_session):
        """Should delete session successfully"""
        response = await test_client.delete(f"/sessions/{seeded_session['id']}")

        assert response.status_code == 204
        assert response.content == b""

    @pytest.mark.asyncio
    async def test_delete_session_removes_from_database(self, test_client: AsyncClient, seeded_session):
        """Should remove session from database"""
        # Delete session
        delete_response = await test_client.delete(f"/sessions/{seeded_session['id']}")
        assert delete_response.status_code == 204

        # Verify it's gone
        get_response = await test_client.get(f"/sessions/{seeded_session['id']}")
        assert get_response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_session_not_found(self, test_client: AsyncClient):
        """Should return 404 when deleting nonexistent session"""
        nonexistent_id = str(uuid.uuid4())
        response = await test_client.delete(f"/sessions/{nonexistent_id}")

        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert nonexistent_id in data["detail"]
