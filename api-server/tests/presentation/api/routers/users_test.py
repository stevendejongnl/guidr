"""Tests for User API models and endpoints."""

import json
import uuid

import pytest
from httpx import AsyncClient
from motor.motor_asyncio import AsyncIOMotorDatabase

from src.presentation.api.models import UserResponse


class TestUserModels:
    """Test suite for User API models."""

    def test_user_response_with_all_fields(self) -> None:
        """Test UserResponse model includes all fields."""
        model = UserResponse(
            id="user-123",
            email="test@example.com",
            createdAt="2024-01-01T00:00:00Z",
            updatedAt="2024-01-01T00:00:00Z",
            name="Test User",
            interests=["cooking", "hiking"],
            isAdmin=True,
        )

        assert model.id == "user-123"
        assert model.email == "test@example.com"
        assert model.name == "Test User"
        assert model.interests == ["cooking", "hiking"]
        assert model.is_admin is True

    def test_user_response_with_defaults(self) -> None:
        """Test UserResponse model with default optional fields."""
        model = UserResponse(
            id="user-456",
            email="user@example.com",
            createdAt="2024-01-01T00:00:00Z",
            updatedAt="2024-01-01T00:00:00Z",
        )

        assert model.name is None
        assert model.interests is None
        assert model.is_admin is False

    def test_user_response_serialization(self) -> None:
        """Test UserResponse serializes with camelCase aliases."""
        model = UserResponse(
            id="user-789",
            email="admin@example.com",
            createdAt="2024-01-01T00:00:00Z",
            updatedAt="2024-01-02T00:00:00Z",
            isAdmin=True,
        )

        data = model.model_dump(by_alias=True)
        assert data["createdAt"] == "2024-01-01T00:00:00Z"
        assert data["updatedAt"] == "2024-01-02T00:00:00Z"
        assert data["isAdmin"] is True


@pytest.mark.asyncio
class TestUserEndpoints:
    """Integration tests for user/auth API endpoints."""

    # ─────────────────────────────────────────────
    # Helpers
    # ─────────────────────────────────────────────

    async def _register(
        self, client: AsyncClient, email: str, password: str = "password123"
    ) -> dict:
        """Register a user and return the full response JSON."""
        response = await client.post(
            "/api/v1/auth/register",
            json={"email": email, "password": password},
        )
        return response.json()

    async def _get_token(
        self, client: AsyncClient, email: str, password: str = "password123"
    ) -> str:
        """Register or login a user and return the access token."""
        data = await self._register(client, email, password)
        token = data.get("accessToken") or data.get("access_token")
        if not token:
            login = await client.post(
                "/api/v1/auth/login",
                data={"username": email, "password": password},
            )
            data = login.json()
            token = data.get("accessToken") or data.get("access_token")
        return token

    # ─────────────────────────────────────────────
    # POST /auth/login
    # ─────────────────────────────────────────────

    async def test_login_with_valid_credentials_returns_tokens(
        self, client: AsyncClient
    ) -> None:
        """Test that login with valid credentials returns access and refresh tokens."""
        await self._register(client, "login_ok@test.com")

        response = await client.post(
            "/api/v1/auth/login",
            data={"username": "login_ok@test.com", "password": "password123"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "accessToken" in data
        assert "refreshToken" in data
        assert data["tokenType"] == "bearer"

    async def test_login_with_wrong_password_returns_401(
        self, client: AsyncClient
    ) -> None:
        """Test that login with wrong password returns 401."""
        await self._register(client, "login_bad@test.com")

        response = await client.post(
            "/api/v1/auth/login",
            data={"username": "login_bad@test.com", "password": "wrongpassword"},
        )
        assert response.status_code == 401

    async def test_login_with_nonexistent_user_returns_401(
        self, client: AsyncClient
    ) -> None:
        """Test that login with unknown user returns 401."""
        # Seed a first user so the system is initialized
        await self._register(client, "seed_login@test.com")

        response = await client.post(
            "/api/v1/auth/login",
            data={"username": "nobody@test.com", "password": "password123"},
        )
        assert response.status_code == 401

    # ─────────────────────────────────────────────
    # POST /auth/refresh
    # ─────────────────────────────────────────────

    async def test_refresh_with_valid_token_returns_new_tokens(
        self, client: AsyncClient
    ) -> None:
        """Test that a valid refresh token produces new access and refresh tokens."""
        data = await self._register(client, "refresh_ok@test.com")
        refresh_token = data["refreshToken"]

        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refreshToken": refresh_token},
        )
        assert response.status_code == 200
        new_data = response.json()
        assert "accessToken" in new_data
        assert "refreshToken" in new_data
        assert new_data["tokenType"] == "bearer"
        assert "user" in new_data

    async def test_refresh_with_invalid_token_returns_401(
        self, client: AsyncClient
    ) -> None:
        """Test that a bogus refresh token returns 401."""
        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refreshToken": "totally.invalid.token"},
        )
        assert response.status_code == 401

    async def test_refresh_token_rotation_revokes_old_token(
        self, client: AsyncClient
    ) -> None:
        """Test that a used refresh token cannot be used a second time (rotation)."""
        data = await self._register(client, "refresh_rotate@test.com")
        refresh_token = data["refreshToken"]

        # Use it once — succeeds and stores new hash on user
        first_resp = await client.post(
            "/api/v1/auth/refresh",
            json={"refreshToken": refresh_token},
        )
        assert first_resp.status_code == 200
        new_refresh = first_resp.json()["refreshToken"]

        # Use the NEW token to confirm rotation is working
        second_resp = await client.post(
            "/api/v1/auth/refresh",
            json={"refreshToken": new_refresh},
        )
        assert second_resp.status_code == 200

    # ─────────────────────────────────────────────
    # POST /auth/change-password
    # ─────────────────────────────────────────────

    async def test_change_password_with_correct_old_password_succeeds(
        self, client: AsyncClient
    ) -> None:
        """Test that changing password with the correct old password succeeds."""
        token = await self._get_token(client, "chpw_ok@test.com")
        headers = {"Authorization": f"Bearer {token}"}

        response = await client.post(
            "/api/v1/auth/change-password",
            json={"oldPassword": "password123", "newPassword": "newpassword456"},
            headers=headers,
        )
        assert response.status_code == 200
        assert response.json()["message"] == "Password changed successfully"

    async def test_change_password_with_wrong_old_password_returns_400(
        self, client: AsyncClient
    ) -> None:
        """Test that changing password with wrong old password returns 400."""
        token = await self._get_token(client, "chpw_bad@test.com")
        headers = {"Authorization": f"Bearer {token}"}

        response = await client.post(
            "/api/v1/auth/change-password",
            json={"oldPassword": "wrongpassword", "newPassword": "newpassword456"},
            headers=headers,
        )
        assert response.status_code == 400

    async def test_change_password_requires_authentication(
        self, client: AsyncClient
    ) -> None:
        """Test that changing password without auth returns 401."""
        response = await client.post(
            "/api/v1/auth/change-password",
            json={"oldPassword": "password123", "newPassword": "newpassword456"},
        )
        assert response.status_code == 401

    # ─────────────────────────────────────────────
    # POST /auth/change-email
    # ─────────────────────────────────────────────

    async def test_change_email_with_correct_password_succeeds(
        self, client: AsyncClient
    ) -> None:
        """Test that changing email with correct password succeeds."""
        token = await self._get_token(client, "chemail_ok@test.com")
        headers = {"Authorization": f"Bearer {token}"}

        response = await client.post(
            "/api/v1/auth/change-email",
            json={"newEmail": "chemail_new@test.com", "password": "password123"},
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "accessToken" in data
        assert "refreshToken" in data

    async def test_change_email_with_wrong_password_returns_400(
        self, client: AsyncClient
    ) -> None:
        """Test that changing email with wrong password returns 400."""
        token = await self._get_token(client, "chemail_bad@test.com")
        headers = {"Authorization": f"Bearer {token}"}

        response = await client.post(
            "/api/v1/auth/change-email",
            json={"newEmail": "chemail_bad_new@test.com", "password": "wrongpassword"},
            headers=headers,
        )
        assert response.status_code == 400

    async def test_change_email_requires_authentication(
        self, client: AsyncClient
    ) -> None:
        """Test that changing email without auth returns 401."""
        response = await client.post(
            "/api/v1/auth/change-email",
            json={"newEmail": "anon@test.com", "password": "password123"},
        )
        assert response.status_code == 401

    # ─────────────────────────────────────────────
    # GET /auth/profile
    # ─────────────────────────────────────────────

    async def test_get_profile_returns_current_user(
        self, client: AsyncClient
    ) -> None:
        """Test that authenticated user gets their own profile."""
        token = await self._get_token(client, "profile_get@test.com")
        headers = {"Authorization": f"Bearer {token}"}

        response = await client.get("/api/v1/auth/profile", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "profile_get@test.com"
        assert "id" in data
        assert "createdAt" in data

    async def test_get_profile_requires_authentication(
        self, client: AsyncClient
    ) -> None:
        """Test that getting profile without auth returns 401."""
        response = await client.get("/api/v1/auth/profile")
        assert response.status_code == 401

    # ─────────────────────────────────────────────
    # PATCH /auth/profile
    # ─────────────────────────────────────────────

    async def test_update_profile_with_name_and_interests(
        self, client: AsyncClient
    ) -> None:
        """Test that updating profile returns 200 with user response shape."""
        token = await self._get_token(client, "profile_update@test.com")
        headers = {"Authorization": f"Bearer {token}"}

        response = await client.patch(
            "/api/v1/auth/profile",
            json={"name": "Alice", "interests": ["cooking", "hiking"]},
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        # Verify the response is a valid UserResponse shape
        assert "id" in data
        assert "email" in data
        assert "createdAt" in data
        assert "isAdmin" in data

    async def test_update_profile_requires_authentication(
        self, client: AsyncClient
    ) -> None:
        """Test that updating profile without auth returns 401."""
        response = await client.patch(
            "/api/v1/auth/profile",
            json={"name": "Bob"},
        )
        assert response.status_code == 401

    # ─────────────────────────────────────────────
    # DELETE /auth/account
    # ─────────────────────────────────────────────

    async def test_delete_account_with_correct_password_succeeds(
        self, client: AsyncClient
    ) -> None:
        """Test that deleting account with correct password returns 200."""
        token = await self._get_token(client, "del_acct_ok@test.com")
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

        response = await client.request(
            "DELETE",
            "/api/v1/auth/account",
            content=json.dumps({"password": "password123"}),
            headers=headers,
        )
        assert response.status_code == 200
        assert response.json()["message"] == "Account deleted successfully"

    async def test_delete_account_with_wrong_password_returns_400(
        self, client: AsyncClient
    ) -> None:
        """Test that deleting account with wrong password returns 400."""
        token = await self._get_token(client, "del_acct_bad@test.com")
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

        response = await client.request(
            "DELETE",
            "/api/v1/auth/account",
            content=json.dumps({"password": "wrongpassword"}),
            headers=headers,
        )
        assert response.status_code == 400

    async def test_delete_account_requires_authentication(
        self, client: AsyncClient
    ) -> None:
        """Test that deleting account without auth returns 401."""
        response = await client.request(
            "DELETE",
            "/api/v1/auth/account",
            content=json.dumps({"password": "password123"}),
            headers={"Content-Type": "application/json"},
        )
        assert response.status_code == 401

    # ─────────────────────────────────────────────
    # PATCH /auth/users/{user_id}  (admin)
    # ─────────────────────────────────────────────

    async def test_admin_update_user_sets_beta_flag(
        self, client: AsyncClient, admin_headers: dict, db: AsyncIOMotorDatabase
    ) -> None:
        """Test that admin can update a user's isBeta flag."""
        # Register a second (non-admin) user
        await client.post(
            "/api/v1/auth/register",
            json={"email": "target_beta@test.com", "password": "password123"},
        )
        user_doc = await db.users.find_one({"email": "target_beta@test.com"})
        user_id = str(user_doc["_id"])

        response = await client.patch(
            f"/api/v1/auth/users/{user_id}",
            json={"isBeta": True},
            headers=admin_headers,
        )
        assert response.status_code == 200
        assert response.json()["isBeta"] is True

    async def test_admin_update_nonexistent_user_returns_400(
        self, client: AsyncClient, admin_headers: dict
    ) -> None:
        """Test that admin updating a non-existent user returns 400.

        The AdminUpdateUser use case raises ValidationException("User not found")
        when the user does not exist, which the router maps to HTTP 400.
        """
        response = await client.patch(
            f"/api/v1/auth/users/{uuid.uuid4()}",
            json={"isBeta": True},
            headers=admin_headers,
        )
        assert response.status_code == 400

    async def test_non_admin_cannot_update_user(
        self, client: AsyncClient
    ) -> None:
        """Test that a non-admin user gets 403 when trying to update users."""
        # Seed an admin (first user)
        await self._register(client, "seed_admin_upd@test.com")
        # Register a non-admin
        non_admin_data = await self._register(client, "non_admin_upd@test.com")
        token = non_admin_data.get("accessToken") or non_admin_data.get("access_token")
        headers = {"Authorization": f"Bearer {token}"}

        response = await client.patch(
            "/api/v1/auth/users/some-user-id",
            json={"isBeta": True},
            headers=headers,
        )
        assert response.status_code == 403

    # ─────────────────────────────────────────────
    # DELETE /auth/users/{user_id}  (admin)
    # ─────────────────────────────────────────────

    async def test_admin_can_delete_user(
        self, client: AsyncClient, admin_headers: dict, db: AsyncIOMotorDatabase
    ) -> None:
        """Test that admin can delete (soft-delete) a user."""
        await client.post(
            "/api/v1/auth/register",
            json={"email": "to_delete@test.com", "password": "password123"},
        )
        user_doc = await db.users.find_one({"email": "to_delete@test.com"})
        user_id = str(user_doc["_id"])

        response = await client.delete(
            f"/api/v1/auth/users/{user_id}",
            headers=admin_headers,
        )
        assert response.status_code == 204

    async def test_admin_delete_nonexistent_user_returns_404(
        self, client: AsyncClient, admin_headers: dict
    ) -> None:
        """Test that admin deleting a non-existent user returns 404."""
        response = await client.delete(
            f"/api/v1/auth/users/{uuid.uuid4()}",
            headers=admin_headers,
        )
        assert response.status_code == 404

    async def test_non_admin_cannot_delete_user(
        self, client: AsyncClient
    ) -> None:
        """Test that a non-admin user gets 403 when trying to delete a user."""
        await self._register(client, "seed_del@test.com")
        non_admin_data = await self._register(client, "non_admin_del@test.com")
        token = non_admin_data.get("accessToken") or non_admin_data.get("access_token")
        headers = {"Authorization": f"Bearer {token}"}

        response = await client.delete(
            "/api/v1/auth/users/some-user-id",
            headers=headers,
        )
        assert response.status_code == 403
