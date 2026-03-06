"""Integration tests for step authorization and ownership."""

from uuid import uuid4

import pytest
from httpx import AsyncClient
from motor.motor_asyncio import AsyncIOMotorDatabase


@pytest.mark.asyncio
class TestStepAuthorizationIntegration:
    """Integration tests for step authorization features."""

    # ═══════════════════════════════════════════════════════════════════════
    # MUTATION TESTS (Create, Update, Delete)
    # ═══════════════════════════════════════════════════════════════════════

    async def test_guide_owner_can_create_step(
        self, client: AsyncClient, db: AsyncIOMotorDatabase
    ) -> None:
        """Test that guide owner can create steps."""

        user_headers = await self._login_user(client, "owner@test.com")

        # Create guide
        guide_response = await client.post(
            "/api/v1/guides",
            json={
                "guideType": "general",
                "title": "Owner's Guide",
                "description": "Test",
            },
            headers=user_headers,
        )
        guide_id = guide_response.json()["id"]

        # Owner creates step
        response = await client.post(
            "/api/v1/steps",
            json={
                "guideId": guide_id,
                "order": 1,
                "title": "Step 1",
                "description": "First step",
            },
            headers=user_headers,
        )
        assert response.status_code == 201
        assert response.json()["title"] == "Step 1"

    async def test_admin_can_create_step_in_others_guide(
        self, client: AsyncClient, db: AsyncIOMotorDatabase
    ) -> None:
        """Test that admin can create steps in any guide."""

        user_headers = await self._login_user(client, "user@test.com")

        # Regular user creates guide
        guide_response = await client.post(
            "/api/v1/guides",
            json={
                "guideType": "general",
                "title": "User's Guide",
                "description": "Test",
            },
            headers=user_headers,
        )
        guide_id = guide_response.json()["id"]

        # Admin creates step in user's guide
        admin_headers = await self._login_admin(client, "admin@test.com", db)
        response = await client.post(
            "/api/v1/steps",
            json={
                "guideId": guide_id,
                "order": 1,
                "title": "Admin's Step",
                "description": "Step by admin",
            },
            headers=admin_headers,
        )
        assert response.status_code == 201

    async def test_non_owner_cannot_create_step(
        self, client: AsyncClient
    ) -> None:
        """Test that non-owner cannot create steps in other's guide."""


        # User 1 creates guide
        user1_headers = await self._login_user(client, "user1@test.com")
        guide_response = await client.post(
            "/api/v1/guides",
            json={
                "guideType": "general",
                "title": "User1's Guide",
                "description": "Test",
            },
            headers=user1_headers,
        )
        guide_id = guide_response.json()["id"]

        # User 2 tries to create step
        user2_headers = await self._login_user(client, "user2@test.com")
        response = await client.post(
            "/api/v1/steps",
            json={
                "guideId": guide_id,
                "order": 1,
                "title": "User2's Step",
            },
            headers=user2_headers,
        )
        assert response.status_code == 403

    async def test_unauthenticated_cannot_create_step(
        self, client: AsyncClient
    ) -> None:
        """Test that unauthenticated users cannot create steps."""


        # Create guide as logged-in user
        headers = await self._login_user(client, "user@test.com")
        guide_response = await client.post(
            "/api/v1/guides",
            json={
                "guideType": "general",
                "title": "Test Guide",
                "description": "Test",
            },
            headers=headers,
        )
        guide_id = guide_response.json()["id"]

        # Try to create step without auth
        response = await client.post(
            "/api/v1/steps",
            json={
                "guideId": guide_id,
                "order": 1,
                "title": "Step",
            },
        )
        assert response.status_code == 401  # No authentication token provided

    async def test_guide_owner_can_update_step(
        self, client: AsyncClient
    ) -> None:
        """Test that guide owner can update steps."""

        user_headers = await self._login_user(client, "owner@test.com")

        # Create guide and step
        guide_response = await client.post(
            "/api/v1/guides",
            json={
                "guideType": "general",
                "title": "Owner's Guide",
                "description": "Test",
            },
            headers=user_headers,
        )
        guide_id = guide_response.json()["id"]

        step_response = await client.post(
            "/api/v1/steps",
            json={
                "guideId": guide_id,
                "order": 1,
                "title": "Original Title",
            },
            headers=user_headers,
        )
        step_id = step_response.json()["id"]

        # Owner updates step
        response = await client.patch(
            f"/api/v1/steps/{step_id}",
            json={"title": "Updated Title"},
            headers=user_headers,
        )
        assert response.status_code == 200
        assert response.json()["title"] == "Updated Title"

    async def test_non_owner_cannot_update_step(
        self, client: AsyncClient
    ) -> None:
        """Test that non-owner cannot update steps."""


        # User 1 creates guide and step
        user1_headers = await self._login_user(client, "user1@test.com")
        guide_response = await client.post(
            "/api/v1/guides",
            json={
                "guideType": "general",
                "title": "User1's Guide",
                "description": "Test",
            },
            headers=user1_headers,
        )
        guide_id = guide_response.json()["id"]

        step_response = await client.post(
            "/api/v1/steps",
            json={
                "guideId": guide_id,
                "order": 1,
                "title": "Original Title",
            },
            headers=user1_headers,
        )
        step_id = step_response.json()["id"]

        # User 2 tries to update step
        user2_headers = await self._login_user(client, "user2@test.com")
        response = await client.patch(
            f"/api/v1/steps/{step_id}",
            json={"title": "Hacked Title"},
            headers=user2_headers,
        )
        assert response.status_code == 403

    async def test_admin_can_update_any_step(
        self, client: AsyncClient, db: AsyncIOMotorDatabase
    ) -> None:
        """Test that admin can update any step."""


        # Regular user creates guide and step
        user_headers = await self._login_user(client, "user@test.com")
        guide_response = await client.post(
            "/api/v1/guides",
            json={
                "guideType": "general",
                "title": "User's Guide",
                "description": "Test",
            },
            headers=user_headers,
        )
        guide_id = guide_response.json()["id"]

        step_response = await client.post(
            "/api/v1/steps",
            json={
                "guideId": guide_id,
                "order": 1,
                "title": "Original Title",
            },
            headers=user_headers,
        )
        step_id = step_response.json()["id"]

        # Admin updates step
        admin_headers = await self._login_admin(client, "admin@test.com", db)
        response = await client.patch(
            f"/api/v1/steps/{step_id}",
            json={"title": "Admin Updated Title"},
            headers=admin_headers,
        )
        assert response.status_code == 200
        assert response.json()["title"] == "Admin Updated Title"

    async def test_guide_owner_can_delete_step(
        self, client: AsyncClient
    ) -> None:
        """Test that guide owner can delete steps."""

        user_headers = await self._login_user(client, "owner@test.com")

        # Create guide and step
        guide_response = await client.post(
            "/api/v1/guides",
            json={
                "guideType": "general",
                "title": "Owner's Guide",
                "description": "Test",
            },
            headers=user_headers,
        )
        guide_id = guide_response.json()["id"]

        step_response = await client.post(
            "/api/v1/steps",
            json={
                "guideId": guide_id,
                "order": 1,
                "title": "Temporary Step",
            },
            headers=user_headers,
        )
        step_id = step_response.json()["id"]

        # Owner deletes step
        response = await client.delete(
            f"/api/v1/steps/{step_id}",
            headers=user_headers,
        )
        assert response.status_code == 204

    async def test_non_owner_cannot_delete_step(
        self, client: AsyncClient
    ) -> None:
        """Test that non-owner cannot delete steps."""


        # User 1 creates guide and step
        user1_headers = await self._login_user(client, "user1@test.com")
        guide_response = await client.post(
            "/api/v1/guides",
            json={
                "guideType": "general",
                "title": "User1's Guide",
                "description": "Test",
            },
            headers=user1_headers,
        )
        guide_id = guide_response.json()["id"]

        step_response = await client.post(
            "/api/v1/steps",
            json={
                "guideId": guide_id,
                "order": 1,
                "title": "Step to Delete",
            },
            headers=user1_headers,
        )
        step_id = step_response.json()["id"]

        # User 2 tries to delete step
        user2_headers = await self._login_user(client, "user2@test.com")
        response = await client.delete(
            f"/api/v1/steps/{step_id}",
            headers=user2_headers,
        )
        assert response.status_code == 403

    async def test_admin_can_delete_any_step(
        self, client: AsyncClient, db: AsyncIOMotorDatabase
    ) -> None:
        """Test that admin can delete any step."""


        # Regular user creates guide and step
        user_headers = await self._login_user(client, "user@test.com")
        guide_response = await client.post(
            "/api/v1/guides",
            json={
                "guideType": "general",
                "title": "User's Guide",
                "description": "Test",
            },
            headers=user_headers,
        )
        guide_id = guide_response.json()["id"]

        step_response = await client.post(
            "/api/v1/steps",
            json={
                "guideId": guide_id,
                "order": 1,
                "title": "Step to Delete",
            },
            headers=user_headers,
        )
        step_id = step_response.json()["id"]

        # Admin deletes step
        admin_headers = await self._login_admin(client, "admin@test.com", db)
        response = await client.delete(
            f"/api/v1/steps/{step_id}",
            headers=admin_headers,
        )
        assert response.status_code == 204

    # ═══════════════════════════════════════════════════════════════════════
    # VISIBILITY TESTS (Read Operations)
    # ═══════════════════════════════════════════════════════════════════════

    async def test_public_guide_steps_visible_to_all(
        self, client: AsyncClient
    ) -> None:
        """Test that steps in public guides are visible to all users."""


        # User 1 creates public guide with step
        user1_headers = await self._login_user(client, "user1@test.com")
        guide_response = await client.post(
            "/api/v1/guides",
            json={
                "guideType": "general",
                "title": "Public Guide",
                "description": "Test",
            },
            headers=user1_headers,
        )
        guide_id = guide_response.json()["id"]

        # Make guide public
        await client.patch(
            f"/api/v1/guides/{guide_id}",
            json={"isPublic": True},
            headers=user1_headers,
        )

        # Create step
        step_response = await client.post(
            "/api/v1/steps",
            json={
                "guideId": guide_id,
                "order": 1,
                "title": "Public Step",
            },
            headers=user1_headers,
        )
        step_id = step_response.json()["id"]

        # User 2 can view step
        user2_headers = await self._login_user(client, "user2@test.com")
        response = await client.get(
            f"/api/v1/steps/{step_id}",
            headers=user2_headers,
        )
        assert response.status_code == 200
        assert response.json()["title"] == "Public Step"

    async def test_unauthenticated_can_view_public_guide_steps(
        self, client: AsyncClient
    ) -> None:
        """Test that unauthenticated users can view steps in public guides."""


        # User creates public guide with step
        user_headers = await self._login_user(client, "user@test.com")
        guide_response = await client.post(
            "/api/v1/guides",
            json={
                "guideType": "general",
                "title": "Public Guide",
                "description": "Test",
            },
            headers=user_headers,
        )
        guide_id = guide_response.json()["id"]

        # Make guide public
        await client.patch(
            f"/api/v1/guides/{guide_id}",
            json={"isPublic": True},
            headers=user_headers,
        )

        # Create step
        step_response = await client.post(
            "/api/v1/steps",
            json={
                "guideId": guide_id,
                "order": 1,
                "title": "Public Step",
            },
            headers=user_headers,
        )
        step_id = step_response.json()["id"]

        # Unauthenticated user can view step
        response = await client.get(f"/api/v1/steps/{step_id}")
        assert response.status_code == 200
        assert response.json()["title"] == "Public Step"

    async def test_private_guide_steps_hidden_from_non_owner(
        self, client: AsyncClient
    ) -> None:
        """Test that steps in private guides are hidden from non-owners."""


        # User 1 creates private guide with step
        user1_headers = await self._login_user(client, "user1@test.com")
        guide_response = await client.post(
            "/api/v1/guides",
            json={
                "guideType": "general",
                "title": "Private Guide",
                "description": "Test",
            },
            headers=user1_headers,
        )
        guide_id = guide_response.json()["id"]

        # Create step (guide is private by default)
        step_response = await client.post(
            "/api/v1/steps",
            json={
                "guideId": guide_id,
                "order": 1,
                "title": "Private Step",
            },
            headers=user1_headers,
        )
        step_id = step_response.json()["id"]

        # User 2 cannot view step
        user2_headers = await self._login_user(client, "user2@test.com")
        response = await client.get(
            f"/api/v1/steps/{step_id}",
            headers=user2_headers,
        )
        assert response.status_code == 404

    async def test_unauthenticated_cannot_view_private_guide_steps(
        self, client: AsyncClient
    ) -> None:
        """Test that unauthenticated users cannot view steps in private guides."""


        # User creates private guide with step
        user_headers = await self._login_user(client, "user@test.com")
        guide_response = await client.post(
            "/api/v1/guides",
            json={
                "guideType": "general",
                "title": "Private Guide",
                "description": "Test",
            },
            headers=user_headers,
        )
        guide_id = guide_response.json()["id"]

        # Create step (guide is private by default)
        step_response = await client.post(
            "/api/v1/steps",
            json={
                "guideId": guide_id,
                "order": 1,
                "title": "Private Step",
            },
            headers=user_headers,
        )
        step_id = step_response.json()["id"]

        # Unauthenticated user cannot view step
        response = await client.get(f"/api/v1/steps/{step_id}")
        assert response.status_code == 404

    async def test_admin_can_view_any_guide_steps(
        self, client: AsyncClient, db: AsyncIOMotorDatabase
    ) -> None:
        """Test that admin can view steps in any guide."""


        # Regular user creates private guide with step
        user_headers = await self._login_user(client, "user@test.com")
        guide_response = await client.post(
            "/api/v1/guides",
            json={
                "guideType": "general",
                "title": "Private Guide",
                "description": "Test",
            },
            headers=user_headers,
        )
        guide_id = guide_response.json()["id"]

        step_response = await client.post(
            "/api/v1/steps",
            json={
                "guideId": guide_id,
                "order": 1,
                "title": "Private Step",
            },
            headers=user_headers,
        )
        step_id = step_response.json()["id"]

        # Admin can view step
        admin_headers = await self._login_admin(client, "admin@test.com", db)
        response = await client.get(
            f"/api/v1/steps/{step_id}",
            headers=admin_headers,
        )
        assert response.status_code == 200
        assert response.json()["title"] == "Private Step"

    async def test_list_steps_respects_guide_visibility(
        self, client: AsyncClient
    ) -> None:
        """Test that list steps respects guide visibility."""


        # User 1 creates private guide with step
        user1_headers = await self._login_user(client, "user1@test.com")
        guide_response = await client.post(
            "/api/v1/guides",
            json={
                "guideType": "general",
                "title": "Private Guide",
                "description": "Test",
            },
            headers=user1_headers,
        )
        guide_id = guide_response.json()["id"]

        await client.post(
            "/api/v1/steps",
            json={
                "guideId": guide_id,
                "order": 1,
                "title": "Private Step",
            },
            headers=user1_headers,
        )

        # User 2 cannot list steps from private guide
        user2_headers = await self._login_user(client, "user2@test.com")
        response = await client.get(
            f"/api/v1/steps?guide_id={guide_id}",
            headers=user2_headers,
        )
        assert response.status_code == 403

    # ═══════════════════════════════════════════════════════════════════════
    # EDGE CASE TESTS
    # ═══════════════════════════════════════════════════════════════════════

    async def test_create_step_with_nonexistent_guide_returns_error(
        self, client: AsyncClient
    ) -> None:
        """Test creating step with non-existent guide returns error."""
        user_headers = await self._login_user(client, "user@test.com")
        response = await client.post(
            "/api/v1/steps",
            json={
                "guideId": str(uuid4()),
                "order": 1,
                "title": "Step",
            },
            headers=user_headers,
        )
        assert response.status_code == 400  # Invalid guide

    async def test_get_step_from_deleted_guide_returns_not_found(
        self, client: AsyncClient, db: AsyncIOMotorDatabase
    ) -> None:
        """Test that getting step from deleted guide returns 404."""

        user_headers = await self._login_user(client, "user@test.com")

        # Create guide and step
        guide_response = await client.post(
            "/api/v1/guides",
            json={
                "guideType": "general",
                "title": "Temp Guide",
                "description": "Test",
            },
            headers=user_headers,
        )
        guide_id = guide_response.json()["id"]

        step_response = await client.post(
            "/api/v1/steps",
            json={
                "guideId": guide_id,
                "order": 1,
                "title": "Step",
            },
            headers=user_headers,
        )
        step_id = step_response.json()["id"]

        # Delete guide
        await client.delete(
            f"/api/v1/guides/{guide_id}",
            headers=user_headers,
        )

        # Try to get step - should return 404
        response = await client.get(
            f"/api/v1/steps/{step_id}",
            headers=user_headers,
        )
        assert response.status_code == 404

    async def test_update_nonexistent_step_returns_not_found(
        self, client: AsyncClient
    ) -> None:
        """Test that updating non-existent step returns 404."""
        user_headers = await self._login_user(client, "user@test.com")
        response = await client.patch(
            f"/api/v1/steps/{uuid4()}",
            json={"title": "New Title"},
            headers=user_headers,
        )
        assert response.status_code == 404

    async def test_delete_nonexistent_step_returns_not_found(
        self, client: AsyncClient
    ) -> None:
        """Test that deleting non-existent step returns 404."""
        user_headers = await self._login_user(client, "user@test.com")
        response = await client.delete(
            f"/api/v1/steps/{uuid4()}",
            headers=user_headers,
        )
        assert response.status_code == 404

    async def test_list_steps_with_invalid_guide_id_returns_400(
        self, client: AsyncClient, auth_headers: dict
    ) -> None:
        """Test that GET /steps?guide_id=generate returns 400, not 500."""
        response = await client.get(
            "/api/v1/steps?guide_id=generate",
            headers=auth_headers,
        )
        assert response.status_code == 400

    # ═══════════════════════════════════════════════════════════════════════
    # HELPER METHODS
    # ═══════════════════════════════════════════════════════════════════════

    async def _login_user(
        self, client: AsyncClient, email: str
    ) -> dict[str, str]:
        """Login or register user and return auth headers."""
        response = await client.post(
            "/api/v1/auth/register",
            json={"email": email, "password": "password123"},
        )
        if response.status_code == 409:  # Already exists
            response = await client.post(
                "/api/v1/auth/login",
                data={"username": email, "password": "password123"},
            )
        data = response.json()
        token = data.get("accessToken") or data.get("access_token")
        return {"Authorization": f"Bearer {token}"}

    async def _login_admin(
        self, client: AsyncClient, email: str, db: AsyncIOMotorDatabase | None = None
    ) -> dict[str, str]:
        """Login as admin user and return auth headers."""
        headers = await self._login_user(client, email)
        # Promote to admin by updating database if db instance provided
        if db is not None:
            user_doc = await db.users.find_one({"email": email})
            if user_doc:
                await db.users.update_one(
                    {"_id": user_doc["_id"]},
                    {"$set": {"role": "admin"}}
                )
        return headers
