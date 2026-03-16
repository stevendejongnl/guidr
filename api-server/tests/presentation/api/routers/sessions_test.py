"""Integration tests for sessions API endpoints."""

import uuid

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestSessionsEndpoints:
    """Integration tests for /sessions endpoints."""

    # ─────────────────────────────────────────────
    # Helpers
    # ─────────────────────────────────────────────

    async def _register_user(
        self, client: AsyncClient, email: str
    ) -> dict[str, str]:
        """Register or login a user and return auth headers."""
        response = await client.post(
            "/api/v1/auth/register",
            json={"email": email, "password": "password123"},
        )
        if response.status_code == 409:
            response = await client.post(
                "/api/v1/auth/login",
                data={"username": email, "password": "password123"},
            )
        token = response.json().get("accessToken") or response.json().get("access_token")
        return {"Authorization": f"Bearer {token}"}

    async def _create_guide(
        self, client: AsyncClient, headers: dict[str, str], title: str = "Session Guide"
    ) -> str:
        """Create a guide and return its ID."""
        response = await client.post(
            "/api/v1/guides",
            json={"guideType": "general", "title": title, "description": "Desc"},
            headers=headers,
        )
        assert response.status_code == 201
        return response.json()["id"]

    async def _create_step(
        self,
        client: AsyncClient,
        headers: dict[str, str],
        guide_id: str,
        order: int = 1,
    ) -> str:
        """Create a step in a guide and return its ID."""
        response = await client.post(
            "/api/v1/steps",
            json={
                "guideId": guide_id,
                "order": order,
                "title": f"Step {order}",
                "description": "A step",
            },
            headers=headers,
        )
        assert response.status_code == 201
        return response.json()["id"]

    async def _create_session(
        self, client: AsyncClient, guide_id: str
    ) -> dict:
        """Create a session for a guide and return the full response JSON."""
        response = await client.post(
            "/api/v1/sessions",
            json={"guideId": guide_id},
        )
        assert response.status_code == 201
        return response.json()

    # ─────────────────────────────────────────────
    # POST /sessions  (create)
    # ─────────────────────────────────────────────

    async def test_create_session_returns_201_with_pending_status(
        self, client: AsyncClient
    ) -> None:
        """Test that creating a session returns 201 with pending status."""
        headers = await self._register_user(client, "sess_create@test.com")
        guide_id = await self._create_guide(client, headers, "Create Session Guide")

        response = await client.post(
            "/api/v1/sessions",
            json={"guideId": guide_id},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["guideId"] == guide_id
        assert data["status"] == "NotStarted"

    async def test_create_session_response_has_all_fields(
        self, client: AsyncClient
    ) -> None:
        """Test that create session response includes all expected fields."""
        headers = await self._register_user(client, "sess_fields@test.com")
        guide_id = await self._create_guide(client, headers, "Fields Guide")

        response = await client.post(
            "/api/v1/sessions",
            json={"guideId": guide_id},
        )
        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert "guideId" in data
        assert "status" in data
        assert "startedAt" in data
        assert "completedAt" in data
        assert "currentStepId" in data
        assert "createdAt" in data
        assert "updatedAt" in data

    async def test_create_session_with_invalid_guide_id_returns_400(
        self, client: AsyncClient
    ) -> None:
        """Test that creating a session with a non-existent guide returns 400."""
        response = await client.post(
            "/api/v1/sessions",
            json={"guideId": str(uuid.uuid4())},
        )
        assert response.status_code == 400

    # ─────────────────────────────────────────────
    # GET /sessions/{session_id}
    # ─────────────────────────────────────────────

    async def test_get_session_returns_200_with_correct_data(
        self, client: AsyncClient
    ) -> None:
        """Test that fetching an existing session returns it correctly."""
        headers = await self._register_user(client, "sess_get@test.com")
        guide_id = await self._create_guide(client, headers, "Get Session Guide")
        session = await self._create_session(client, guide_id)

        response = await client.get(f"/api/v1/sessions/{session['id']}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == session["id"]
        assert data["guideId"] == guide_id

    async def test_get_nonexistent_session_returns_404(
        self, client: AsyncClient
    ) -> None:
        """Test that fetching a non-existent session returns 404."""
        response = await client.get(f"/api/v1/sessions/{uuid.uuid4()}")
        assert response.status_code == 404

    # ─────────────────────────────────────────────
    # GET /sessions  (list)
    # ─────────────────────────────────────────────

    async def test_list_all_sessions_returns_list(
        self, client: AsyncClient
    ) -> None:
        """Test that listing sessions returns a list."""
        response = await client.get("/api/v1/sessions")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    async def test_list_sessions_filter_by_guide_id(
        self, client: AsyncClient
    ) -> None:
        """Test listing sessions filtered by guide_id."""
        headers = await self._register_user(client, "sess_list_guide@test.com")
        guide_id = await self._create_guide(client, headers, "List By Guide")
        await self._create_session(client, guide_id)

        response = await client.get(
            "/api/v1/sessions", params={"guide_id": guide_id}
        )
        assert response.status_code == 200
        sessions = response.json()
        assert isinstance(sessions, list)
        assert all(s["guideId"] == guide_id for s in sessions)

    async def test_list_sessions_filter_by_status(
        self, client: AsyncClient
    ) -> None:
        """Test listing sessions filtered by status_filter."""
        headers = await self._register_user(client, "sess_list_status@test.com")
        guide_id = await self._create_guide(client, headers, "List By Status")
        await self._create_session(client, guide_id)

        response = await client.get(
            "/api/v1/sessions", params={"status_filter": "NotStarted"}
        )
        assert response.status_code == 200
        sessions = response.json()
        assert isinstance(sessions, list)

    async def test_newly_created_session_appears_in_list(
        self, client: AsyncClient
    ) -> None:
        """Test that a newly created session shows up when listing all sessions."""
        headers = await self._register_user(client, "sess_list_appear@test.com")
        guide_id = await self._create_guide(client, headers, "Appear In List")
        session = await self._create_session(client, guide_id)

        response = await client.get("/api/v1/sessions")
        assert response.status_code == 200
        ids = [s["id"] for s in response.json()]
        assert session["id"] in ids

    # ─────────────────────────────────────────────
    # POST /sessions/{id}/start
    # ─────────────────────────────────────────────

    async def test_start_session_transitions_to_active(
        self, client: AsyncClient
    ) -> None:
        """Test that starting a session changes status to active."""
        headers = await self._register_user(client, "sess_start@test.com")
        guide_id = await self._create_guide(client, headers, "Start Session Guide")
        session = await self._create_session(client, guide_id)

        response = await client.post(
            f"/api/v1/sessions/{session['id']}/start",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "InProgress"
        assert data["startedAt"] is not None

    async def test_start_session_requires_authentication(
        self, client: AsyncClient
    ) -> None:
        """Test that starting a session without auth returns 401."""
        headers = await self._register_user(client, "sess_start_auth@test.com")
        guide_id = await self._create_guide(client, headers, "Start Auth Guide")
        session = await self._create_session(client, guide_id)

        response = await client.post(f"/api/v1/sessions/{session['id']}/start")
        assert response.status_code == 401

    async def test_start_nonexistent_session_returns_404(
        self, client: AsyncClient
    ) -> None:
        """Test that starting a non-existent session returns 404."""
        headers = await self._register_user(client, "sess_start_404@test.com")
        response = await client.post(
            f"/api/v1/sessions/{uuid.uuid4()}/start",
            headers=headers,
        )
        assert response.status_code == 404

    async def test_starting_already_active_session_returns_400(
        self, client: AsyncClient
    ) -> None:
        """Test that starting an already active session returns 400."""
        headers = await self._register_user(client, "sess_start_dupe@test.com")
        guide_id = await self._create_guide(client, headers, "Dupe Start Guide")
        session = await self._create_session(client, guide_id)

        # Start once
        await client.post(
            f"/api/v1/sessions/{session['id']}/start",
            headers=headers,
        )
        # Start again — should fail (already active)
        response = await client.post(
            f"/api/v1/sessions/{session['id']}/start",
            headers=headers,
        )
        assert response.status_code == 400

    # ─────────────────────────────────────────────
    # POST /sessions/{id}/pause
    # ─────────────────────────────────────────────

    async def test_pause_active_session_transitions_to_paused(
        self, client: AsyncClient
    ) -> None:
        """Test that pausing an active session changes status to paused."""
        headers = await self._register_user(client, "sess_pause@test.com")
        guide_id = await self._create_guide(client, headers, "Pause Guide")
        session = await self._create_session(client, guide_id)

        await client.post(
            f"/api/v1/sessions/{session['id']}/start",
            headers=headers,
        )

        response = await client.post(
            f"/api/v1/sessions/{session['id']}/pause",
            json={"stepElapsedSeconds": 10},
            headers=headers,
        )
        assert response.status_code == 200
        assert response.json()["status"] == "Paused"

    async def test_pause_session_requires_authentication(
        self, client: AsyncClient
    ) -> None:
        """Test that pausing a session without auth returns 401."""
        headers = await self._register_user(client, "sess_pause_auth@test.com")
        guide_id = await self._create_guide(client, headers, "Pause Auth Guide")
        session = await self._create_session(client, guide_id)

        await client.post(f"/api/v1/sessions/{session['id']}/start", headers=headers)

        response = await client.post(
            f"/api/v1/sessions/{session['id']}/pause",
            json={"stepElapsedSeconds": 5},
        )
        assert response.status_code == 401

    async def test_pause_nonexistent_session_returns_404(
        self, client: AsyncClient
    ) -> None:
        """Test that pausing a non-existent session returns 404."""
        headers = await self._register_user(client, "sess_pause_404@test.com")
        response = await client.post(
            f"/api/v1/sessions/{uuid.uuid4()}/pause",
            json={"stepElapsedSeconds": 0},
            headers=headers,
        )
        assert response.status_code == 404

    # ─────────────────────────────────────────────
    # POST /sessions/{id}/resume
    # ─────────────────────────────────────────────

    async def test_resume_paused_session_transitions_to_active(
        self, client: AsyncClient
    ) -> None:
        """Test that resuming a paused session changes status to active."""
        headers = await self._register_user(client, "sess_resume@test.com")
        guide_id = await self._create_guide(client, headers, "Resume Guide")
        session = await self._create_session(client, guide_id)

        await client.post(f"/api/v1/sessions/{session['id']}/start", headers=headers)
        await client.post(
            f"/api/v1/sessions/{session['id']}/pause",
            json={"stepElapsedSeconds": 5},
            headers=headers,
        )

        response = await client.post(
            f"/api/v1/sessions/{session['id']}/resume",
            headers=headers,
        )
        assert response.status_code == 200
        assert response.json()["status"] == "InProgress"

    async def test_resume_session_requires_authentication(
        self, client: AsyncClient
    ) -> None:
        """Test that resuming a session without auth returns 401."""
        headers = await self._register_user(client, "sess_resume_auth@test.com")
        guide_id = await self._create_guide(client, headers, "Resume Auth Guide")
        session = await self._create_session(client, guide_id)

        response = await client.post(f"/api/v1/sessions/{session['id']}/resume")
        assert response.status_code == 401

    async def test_resume_nonexistent_session_returns_404(
        self, client: AsyncClient
    ) -> None:
        """Test that resuming a non-existent session returns 404."""
        headers = await self._register_user(client, "sess_resume_404@test.com")
        response = await client.post(
            f"/api/v1/sessions/{uuid.uuid4()}/resume",
            headers=headers,
        )
        assert response.status_code == 404

    # ─────────────────────────────────────────────
    # POST /sessions/{id}/complete
    # ─────────────────────────────────────────────

    async def test_complete_active_session_transitions_to_completed(
        self, client: AsyncClient
    ) -> None:
        """Test that completing an active session changes status to completed."""
        headers = await self._register_user(client, "sess_complete@test.com")
        guide_id = await self._create_guide(client, headers, "Complete Guide")
        session = await self._create_session(client, guide_id)

        await client.post(f"/api/v1/sessions/{session['id']}/start", headers=headers)

        response = await client.post(
            f"/api/v1/sessions/{session['id']}/complete",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "Completed"
        assert data["completedAt"] is not None

    async def test_complete_session_requires_authentication(
        self, client: AsyncClient
    ) -> None:
        """Test that completing a session without auth returns 401."""
        headers = await self._register_user(client, "sess_complete_auth@test.com")
        guide_id = await self._create_guide(client, headers, "Complete Auth Guide")
        session = await self._create_session(client, guide_id)

        response = await client.post(f"/api/v1/sessions/{session['id']}/complete")
        assert response.status_code == 401

    async def test_complete_nonexistent_session_returns_404(
        self, client: AsyncClient
    ) -> None:
        """Test that completing a non-existent session returns 404."""
        headers = await self._register_user(client, "sess_complete_404@test.com")
        response = await client.post(
            f"/api/v1/sessions/{uuid.uuid4()}/complete",
            headers=headers,
        )
        assert response.status_code == 404

    # ─────────────────────────────────────────────
    # POST /sessions/{id}/cancel
    # ─────────────────────────────────────────────

    async def test_cancel_active_session_transitions_to_cancelled(
        self, client: AsyncClient
    ) -> None:
        """Test that cancelling an active session changes status to cancelled."""
        headers = await self._register_user(client, "sess_cancel@test.com")
        guide_id = await self._create_guide(client, headers, "Cancel Guide")
        session = await self._create_session(client, guide_id)

        await client.post(f"/api/v1/sessions/{session['id']}/start", headers=headers)

        response = await client.post(
            f"/api/v1/sessions/{session['id']}/cancel",
            headers=headers,
        )
        assert response.status_code == 200
        assert response.json()["status"] == "Cancelled"

    async def test_cancel_session_requires_authentication(
        self, client: AsyncClient
    ) -> None:
        """Test that cancelling a session without auth returns 401."""
        headers = await self._register_user(client, "sess_cancel_auth@test.com")
        guide_id = await self._create_guide(client, headers, "Cancel Auth Guide")
        session = await self._create_session(client, guide_id)

        response = await client.post(f"/api/v1/sessions/{session['id']}/cancel")
        assert response.status_code == 401

    async def test_cancel_nonexistent_session_returns_404(
        self, client: AsyncClient
    ) -> None:
        """Test that cancelling a non-existent session returns 404."""
        headers = await self._register_user(client, "sess_cancel_404@test.com")
        response = await client.post(
            f"/api/v1/sessions/{uuid.uuid4()}/cancel",
            headers=headers,
        )
        assert response.status_code == 404

    # ─────────────────────────────────────────────
    # POST /sessions/{id}/move-to-step
    # ─────────────────────────────────────────────

    async def test_move_to_step_updates_current_step_id(
        self, client: AsyncClient
    ) -> None:
        """Test that move-to-step updates the session's currentStepId."""
        headers = await self._register_user(client, "sess_move@test.com")
        guide_id = await self._create_guide(client, headers, "Move Step Guide")
        step_id = await self._create_step(client, headers, guide_id)
        session = await self._create_session(client, guide_id)

        await client.post(f"/api/v1/sessions/{session['id']}/start", headers=headers)

        response = await client.post(
            f"/api/v1/sessions/{session['id']}/move-to-step",
            json={"stepId": step_id},
            headers=headers,
        )
        assert response.status_code == 200
        assert response.json()["currentStepId"] == step_id

    async def test_move_to_step_requires_authentication(
        self, client: AsyncClient
    ) -> None:
        """Test that move-to-step without auth returns 401."""
        headers = await self._register_user(client, "sess_move_auth@test.com")
        guide_id = await self._create_guide(client, headers, "Move Auth Guide")
        step_id = await self._create_step(client, headers, guide_id)
        session = await self._create_session(client, guide_id)

        response = await client.post(
            f"/api/v1/sessions/{session['id']}/move-to-step",
            json={"stepId": step_id},
        )
        assert response.status_code == 401

    async def test_move_to_step_nonexistent_session_returns_404(
        self, client: AsyncClient
    ) -> None:
        """Test that move-to-step on a non-existent session returns 404."""
        headers = await self._register_user(client, "sess_move_404@test.com")
        guide_id = await self._create_guide(client, headers, "Move 404 Guide")
        step_id = await self._create_step(client, headers, guide_id)

        response = await client.post(
            f"/api/v1/sessions/{uuid.uuid4()}/move-to-step",
            json={"stepId": step_id},
            headers=headers,
        )
        assert response.status_code == 404

    # ─────────────────────────────────────────────
    # DELETE /sessions/{id}
    # ─────────────────────────────────────────────

    async def test_delete_session_returns_204(
        self, client: AsyncClient
    ) -> None:
        """Test that deleting a session returns 204 No Content."""
        headers = await self._register_user(client, "sess_delete@test.com")
        guide_id = await self._create_guide(client, headers, "Delete Session Guide")
        session = await self._create_session(client, guide_id)

        response = await client.delete(f"/api/v1/sessions/{session['id']}")
        assert response.status_code == 204

    async def test_deleted_session_no_longer_retrievable(
        self, client: AsyncClient
    ) -> None:
        """Test that a deleted session returns 404 on subsequent GET."""
        headers = await self._register_user(client, "sess_del_gone@test.com")
        guide_id = await self._create_guide(client, headers, "Del Gone Guide")
        session = await self._create_session(client, guide_id)

        await client.delete(f"/api/v1/sessions/{session['id']}")

        response = await client.get(f"/api/v1/sessions/{session['id']}")
        assert response.status_code == 404

    # ─────────────────────────────────────────────
    # Full lifecycle
    # ─────────────────────────────────────────────

    async def test_full_session_lifecycle_pending_to_completed(
        self, client: AsyncClient
    ) -> None:
        """Test the full happy-path: create → start → complete."""
        headers = await self._register_user(client, "sess_lifecycle@test.com")
        guide_id = await self._create_guide(client, headers, "Lifecycle Guide")

        # Create
        create_resp = await client.post(
            "/api/v1/sessions",
            json={"guideId": guide_id},
        )
        assert create_resp.status_code == 201
        session_id = create_resp.json()["id"]
        assert create_resp.json()["status"] == "NotStarted"

        # Start
        start_resp = await client.post(
            f"/api/v1/sessions/{session_id}/start",
            headers=headers,
        )
        assert start_resp.status_code == 200
        assert start_resp.json()["status"] == "InProgress"

        # Complete
        complete_resp = await client.post(
            f"/api/v1/sessions/{session_id}/complete",
            headers=headers,
        )
        assert complete_resp.status_code == 200
        assert complete_resp.json()["status"] == "Completed"

    async def test_full_session_lifecycle_with_pause_and_resume(
        self, client: AsyncClient
    ) -> None:
        """Test lifecycle: create → start → pause → resume → complete."""
        headers = await self._register_user(client, "sess_pause_resume@test.com")
        guide_id = await self._create_guide(client, headers, "Pause Resume Guide")

        session = await self._create_session(client, guide_id)
        session_id = session["id"]

        await client.post(f"/api/v1/sessions/{session_id}/start", headers=headers)
        await client.post(
            f"/api/v1/sessions/{session_id}/pause",
            json={"stepElapsedSeconds": 15},
            headers=headers,
        )

        resume_resp = await client.post(
            f"/api/v1/sessions/{session_id}/resume",
            headers=headers,
        )
        assert resume_resp.status_code == 200
        assert resume_resp.json()["status"] == "InProgress"

        complete_resp = await client.post(
            f"/api/v1/sessions/{session_id}/complete",
            headers=headers,
        )
        assert complete_resp.status_code == 200
        assert complete_resp.json()["status"] == "Completed"
