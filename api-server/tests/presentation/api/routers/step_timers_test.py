"""Integration tests for step timers API endpoints."""

import uuid

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestStepTimersEndpoints:
    """Integration tests for /step-timers endpoints."""

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

    async def _create_guide_with_step(
        self,
        client: AsyncClient,
        headers: dict[str, str],
        guide_title: str = "Timer Guide",
    ) -> tuple[str, str]:
        """Create a guide with one step. Returns (guide_id, step_id)."""
        guide_resp = await client.post(
            "/api/v1/guides",
            json={"guideType": "general", "title": guide_title, "description": "Desc"},
            headers=headers,
        )
        assert guide_resp.status_code == 201
        guide_id = guide_resp.json()["id"]

        step_resp = await client.post(
            "/api/v1/steps",
            json={
                "guideId": guide_id,
                "order": 1,
                "title": "Step 1",
                "description": "First step",
            },
            headers=headers,
        )
        assert step_resp.status_code == 201
        step_id = step_resp.json()["id"]
        return guide_id, step_id

    # ─────────────────────────────────────────────
    # POST /step-timers/start
    # ─────────────────────────────────────────────

    async def test_start_timer_returns_200_with_running_status(
        self, client: AsyncClient
    ) -> None:
        """Test that starting a timer returns 200 with running status."""
        headers = await self._register_user(client, "timer_start@test.com")
        guide_id, step_id = await self._create_guide_with_step(client, headers)

        response = await client.post(
            "/api/v1/step-timers/start",
            json={"stepId": step_id, "guideId": guide_id, "durationSeconds": 60},
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "running"
        assert data["stepId"] == step_id
        assert data["guideId"] == guide_id
        assert data["durationSeconds"] == 60

    async def test_start_timer_returns_correct_response_fields(
        self, client: AsyncClient
    ) -> None:
        """Test that start timer response has all expected fields."""
        headers = await self._register_user(client, "timer_fields@test.com")
        guide_id, step_id = await self._create_guide_with_step(client, headers)

        response = await client.post(
            "/api/v1/step-timers/start",
            json={"stepId": step_id, "guideId": guide_id, "durationSeconds": 30},
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "stepId" in data
        assert "guideId" in data
        assert "userId" in data
        assert "status" in data
        assert "accumulatedSeconds" in data
        assert "durationSeconds" in data
        assert "createdAt" in data
        assert "updatedAt" in data

    async def test_start_timer_stopwatch_mode_has_no_remaining_seconds(
        self, client: AsyncClient
    ) -> None:
        """Test that duration=0 (stopwatch mode) returns remainingSeconds=None."""
        headers = await self._register_user(client, "timer_stopwatch@test.com")
        guide_id, step_id = await self._create_guide_with_step(client, headers)

        response = await client.post(
            "/api/v1/step-timers/start",
            json={"stepId": step_id, "guideId": guide_id, "durationSeconds": 0},
            headers=headers,
        )
        assert response.status_code == 200
        assert response.json()["remainingSeconds"] is None

    async def test_start_timer_requires_authentication(
        self, client: AsyncClient
    ) -> None:
        """Test that unauthenticated start request returns 401."""
        response = await client.post(
            "/api/v1/step-timers/start",
            json={"stepId": "s-1", "guideId": "g-1", "durationSeconds": 60},
        )
        assert response.status_code == 401

    # ─────────────────────────────────────────────
    # GET /step-timers/active
    # ─────────────────────────────────────────────

    async def test_get_active_timers_returns_empty_list_initially(
        self, client: AsyncClient
    ) -> None:
        """Test that a new user has no active timers."""
        headers = await self._register_user(client, "timer_active_empty@test.com")
        response = await client.get("/api/v1/step-timers/active", headers=headers)
        assert response.status_code == 200
        assert response.json() == []

    async def test_get_active_timers_returns_running_timer(
        self, client: AsyncClient
    ) -> None:
        """Test that a started timer appears in the active timers list."""
        headers = await self._register_user(client, "timer_active_has@test.com")
        guide_id, step_id = await self._create_guide_with_step(
            client, headers, "Active Timer Guide"
        )

        await client.post(
            "/api/v1/step-timers/start",
            json={"stepId": step_id, "guideId": guide_id, "durationSeconds": 60},
            headers=headers,
        )

        response = await client.get("/api/v1/step-timers/active", headers=headers)
        assert response.status_code == 200
        timers = response.json()
        assert len(timers) >= 1
        assert any(t["stepId"] == step_id for t in timers)

    async def test_get_active_timers_includes_guide_and_step_titles(
        self, client: AsyncClient
    ) -> None:
        """Test that active timer response includes guideTitle and stepTitle."""
        headers = await self._register_user(client, "timer_active_titles@test.com")
        guide_id, step_id = await self._create_guide_with_step(
            client, headers, "Title Guide"
        )

        await client.post(
            "/api/v1/step-timers/start",
            json={"stepId": step_id, "guideId": guide_id, "durationSeconds": 60},
            headers=headers,
        )

        response = await client.get("/api/v1/step-timers/active", headers=headers)
        assert response.status_code == 200
        timers = response.json()
        assert len(timers) >= 1
        timer = timers[0]
        assert "guideTitle" in timer
        assert "stepTitle" in timer

    async def test_get_active_timers_requires_authentication(
        self, client: AsyncClient
    ) -> None:
        """Test that unauthenticated active timers request returns 401."""
        response = await client.get("/api/v1/step-timers/active")
        assert response.status_code == 401

    # ─────────────────────────────────────────────
    # POST /step-timers/{timer_id}/pause
    # ─────────────────────────────────────────────

    async def test_pause_running_timer_returns_paused_status(
        self, client: AsyncClient
    ) -> None:
        """Test that pausing a running timer changes status to paused."""
        headers = await self._register_user(client, "timer_pause@test.com")
        guide_id, step_id = await self._create_guide_with_step(
            client, headers, "Pause Guide"
        )

        start_resp = await client.post(
            "/api/v1/step-timers/start",
            json={"stepId": step_id, "guideId": guide_id, "durationSeconds": 120},
            headers=headers,
        )
        timer_id = start_resp.json()["id"]

        response = await client.post(
            f"/api/v1/step-timers/{timer_id}/pause",
            headers=headers,
        )
        assert response.status_code == 200
        assert response.json()["status"] == "paused"

    async def test_pause_nonexistent_timer_returns_404(
        self, client: AsyncClient
    ) -> None:
        """Test that pausing a non-existent timer returns 404."""
        headers = await self._register_user(client, "timer_pause_404@test.com")
        response = await client.post(
            f"/api/v1/step-timers/{uuid.uuid4()}/pause",
            headers=headers,
        )
        assert response.status_code == 404

    async def test_pause_timer_requires_authentication(
        self, client: AsyncClient
    ) -> None:
        """Test that unauthenticated pause request returns 401."""
        response = await client.post("/api/v1/step-timers/some-id/pause")
        assert response.status_code == 401

    # ─────────────────────────────────────────────
    # POST /step-timers/{timer_id}/reset
    # ─────────────────────────────────────────────

    async def test_reset_timer_returns_idle_status(
        self, client: AsyncClient
    ) -> None:
        """Test that resetting a timer returns idle status."""
        headers = await self._register_user(client, "timer_reset@test.com")
        guide_id, step_id = await self._create_guide_with_step(
            client, headers, "Reset Guide"
        )

        start_resp = await client.post(
            "/api/v1/step-timers/start",
            json={"stepId": step_id, "guideId": guide_id, "durationSeconds": 60},
            headers=headers,
        )
        timer_id = start_resp.json()["id"]

        response = await client.post(
            f"/api/v1/step-timers/{timer_id}/reset",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "idle"
        assert data["accumulatedSeconds"] == 0

    async def test_reset_nonexistent_timer_returns_404(
        self, client: AsyncClient
    ) -> None:
        """Test that resetting a non-existent timer returns 404."""
        headers = await self._register_user(client, "timer_reset_404@test.com")
        response = await client.post(
            f"/api/v1/step-timers/{uuid.uuid4()}/reset",
            headers=headers,
        )
        assert response.status_code == 404

    async def test_reset_timer_requires_authentication(
        self, client: AsyncClient
    ) -> None:
        """Test that unauthenticated reset request returns 401."""
        response = await client.post("/api/v1/step-timers/some-id/reset")
        assert response.status_code == 401

    # ─────────────────────────────────────────────
    # GET /step-timers?guide_id=...
    # ─────────────────────────────────────────────

    async def test_list_timers_for_guide_returns_empty_initially(
        self, client: AsyncClient
    ) -> None:
        """Test listing timers for a guide with no timers returns empty list."""
        headers = await self._register_user(client, "timer_list_empty@test.com")
        guide_id, _ = await self._create_guide_with_step(
            client, headers, "Empty Timer Guide"
        )

        response = await client.get(
            "/api/v1/step-timers",
            params={"guide_id": guide_id},
            headers=headers,
        )
        assert response.status_code == 200
        assert response.json() == []

    async def test_list_timers_for_guide_returns_started_timers(
        self, client: AsyncClient
    ) -> None:
        """Test listing timers for a guide after starting one."""
        headers = await self._register_user(client, "timer_list_has@test.com")
        guide_id, step_id = await self._create_guide_with_step(
            client, headers, "List Timer Guide"
        )

        await client.post(
            "/api/v1/step-timers/start",
            json={"stepId": step_id, "guideId": guide_id, "durationSeconds": 60},
            headers=headers,
        )

        response = await client.get(
            "/api/v1/step-timers",
            params={"guide_id": guide_id},
            headers=headers,
        )
        assert response.status_code == 200
        timers = response.json()
        assert len(timers) >= 1
        assert timers[0]["guideId"] == guide_id

    async def test_list_timers_requires_authentication(
        self, client: AsyncClient
    ) -> None:
        """Test that unauthenticated list request returns 401."""
        response = await client.get(
            "/api/v1/step-timers", params={"guide_id": "some-id"}
        )
        assert response.status_code == 401

    async def test_pause_then_resume_timer_via_start(
        self, client: AsyncClient
    ) -> None:
        """Test that calling start on a paused timer resumes it (running status)."""
        headers = await self._register_user(client, "timer_resume@test.com")
        guide_id, step_id = await self._create_guide_with_step(
            client, headers, "Resume Guide"
        )

        # Start
        start_resp = await client.post(
            "/api/v1/step-timers/start",
            json={"stepId": step_id, "guideId": guide_id, "durationSeconds": 120},
            headers=headers,
        )
        timer_id = start_resp.json()["id"]

        # Pause
        await client.post(f"/api/v1/step-timers/{timer_id}/pause", headers=headers)

        # Resume via start again
        resume_resp = await client.post(
            "/api/v1/step-timers/start",
            json={"stepId": step_id, "guideId": guide_id, "durationSeconds": 120},
            headers=headers,
        )
        assert resume_resp.status_code == 200
        assert resume_resp.json()["status"] == "running"
