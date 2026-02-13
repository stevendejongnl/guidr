"""Integration tests for admin users endpoint."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestAdminUsersEndpoint:
    """Integration tests for GET /auth/users (admin only)."""

    async def test_admin_can_list_users(
        self, client: AsyncClient, admin_headers: dict
    ) -> None:
        """Test that admin users can list all users."""
        response = await client.get(
            "/api/v1/auth/users",
            headers=admin_headers,
        )
        assert response.status_code == 200
        users = response.json()
        assert isinstance(users, list)
        assert len(users) >= 1

        # Verify response shape
        user = users[0]
        assert "id" in user
        assert "email" in user
        assert "createdAt" in user
        assert "isAdmin" in user

    async def test_non_admin_gets_403(
        self, client: AsyncClient
    ) -> None:
        """Test that non-admin users get 403 Forbidden."""
        # First user auto-promotes to admin, so register a seed user first
        await client.post(
            "/api/v1/auth/register",
            json={"email": "seed@test.com", "password": "password123"},
        )
        # Second user is a regular (non-admin) user
        reg_response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "nonadmin@test.com",
                "password": "password123",
            },
        )
        data = reg_response.json()
        token = data.get("accessToken") or data.get("access_token")
        headers = {"Authorization": f"Bearer {token}"}

        response = await client.get(
            "/api/v1/auth/users",
            headers=headers,
        )
        assert response.status_code == 403

    async def test_unauthenticated_gets_401(
        self, client: AsyncClient
    ) -> None:
        """Test that unauthenticated requests get 401."""
        response = await client.get("/api/v1/auth/users")
        assert response.status_code == 401
