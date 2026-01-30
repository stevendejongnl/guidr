"""Integration tests for guide visibility and ownership."""

import pytest
from httpx import AsyncClient
from motor.motor_asyncio import AsyncIOMotorDatabase


@pytest.mark.asyncio
class TestGuideVisibilityIntegration:
    """Integration tests for guide visibility features."""

    async def test_create_guide_is_private_by_default(
        self, client: AsyncClient, auth_headers: dict, db: AsyncIOMotorDatabase
    ) -> None:
        """Test that created guides are private by default."""
        # Create a guide
        response = await client.post(
            "/api/guides",
            json={
                "categoryId": "cat-1",
                "title": "New Guide",
                "description": "Test guide",
            },
            headers=auth_headers,
        )
        assert response.status_code == 201
        guide_data = response.json()

        # Verify guide is private
        assert guide_data["isPublic"] is False
        assert guide_data["isHighlighted"] is False

    async def test_user_can_make_guide_public(
        self, client: AsyncClient, auth_headers: dict, db: AsyncIOMotorDatabase
    ) -> None:
        """Test that user can toggle guide visibility to public."""
        # Create a guide
        create_response = await client.post(
            "/api/guides",
            json={
                "categoryId": "cat-1",
                "title": "Public Guide",
                "description": "Test",
            },
            headers=auth_headers,
        )
        guide_id = create_response.json()["id"]

        # Make it public
        response = await client.patch(
            f"/api/guides/{guide_id}",
            json={"isPublic": True},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["isPublic"] is True

    async def test_user_cannot_edit_others_private_guide(
        self, client: AsyncClient, db: AsyncIOMotorDatabase
    ) -> None:
        """Test that users cannot edit other users' private guides."""
        # Create first user and guide
        user1_headers = await self._login_user(client, "user1@test.com")
        create_response = await client.post(
            "/api/guides",
            json={
                "categoryId": "cat-1",
                "title": "Private Guide",
                "description": "User 1's private guide",
            },
            headers=user1_headers,
        )
        guide_id = create_response.json()["id"]

        # Try to edit with different user
        user2_headers = await self._login_user(client, "user2@test.com")
        response = await client.patch(
            f"/api/guides/{guide_id}",
            json={"title": "Hacked Title"},
            headers=user2_headers,
        )
        assert response.status_code == 403

    async def test_admin_can_edit_any_guide(
        self, client: AsyncClient, db: AsyncIOMotorDatabase
    ) -> None:
        """Test that admins can edit any guide."""
        # Create regular user and guide
        user_headers = await self._login_user(client, "user@test.com")
        create_response = await client.post(
            "/api/guides",
            json={
                "categoryId": "cat-1",
                "title": "Original Title",
                "description": "User's guide",
            },
            headers=user_headers,
        )
        guide_id = create_response.json()["id"]

        # Admin edits the guide
        admin_headers = await self._login_admin(client, "admin@test.com")
        response = await client.patch(
            f"/api/guides/{guide_id}",
            json={"title": "Admin Modified Title"},
            headers=admin_headers,
        )
        assert response.status_code == 200
        assert response.json()["title"] == "Admin Modified Title"

    async def test_public_guides_visible_to_all(
        self, client: AsyncClient, auth_headers: dict
    ) -> None:
        """Test that public guides are visible in list for all users."""
        # Create public guide
        create_response = await client.post(
            "/api/guides",
            json={
                "categoryId": "cat-1",
                "title": "Public Guide",
                "description": "Anyone can see",
            },
            headers=auth_headers,
        )
        guide_id = create_response.json()["id"]

        # Make it public
        await client.patch(
            f"/api/guides/{guide_id}",
            json={"isPublic": True},
            headers=auth_headers,
        )

        # Different user should see it
        other_headers = await self._login_user(client, "other@test.com")
        response = await client.get(
            f"/api/guides/{guide_id}",
            headers=other_headers,
        )
        assert response.status_code == 200

    async def test_private_guides_hidden_from_others(
        self, client: AsyncClient, db: AsyncIOMotorDatabase
    ) -> None:
        """Test that private guides are not visible to other users."""
        # Create private guide
        user_headers = await self._login_user(client, "user@test.com")
        create_response = await client.post(
            "/api/guides",
            json={
                "categoryId": "cat-1",
                "title": "Private Guide",
                "description": "Only I can see",
            },
            headers=user_headers,
        )
        guide_id = create_response.json()["id"]

        # Different user tries to access
        other_headers = await self._login_user(client, "other@test.com")
        response = await client.get(
            f"/api/guides/{guide_id}",
            headers=other_headers,
        )
        assert response.status_code == 404

    async def test_admin_can_highlight_guide(
        self, client: AsyncClient, auth_headers: dict
    ) -> None:
        """Test that admin can highlight guides."""
        # Create and make public
        create_response = await client.post(
            "/api/guides",
            json={
                "categoryId": "cat-1",
                "title": "Featured Guide",
                "description": "Will be highlighted",
            },
            headers=auth_headers,
        )
        guide_id = create_response.json()["id"]

        await client.patch(
            f"/api/guides/{guide_id}",
            json={"isPublic": True},
            headers=auth_headers,
        )

        # Admin highlights it
        admin_headers = await self._login_admin(client, "admin@test.com")
        response = await client.patch(
            f"/api/guides/{guide_id}/highlight",
            json={"isHighlighted": True},
            headers=admin_headers,
        )
        assert response.status_code == 200
        assert response.json()["isHighlighted"] is True

    async def test_non_admin_cannot_highlight_guide(
        self, client: AsyncClient, auth_headers: dict
    ) -> None:
        """Test that non-admins cannot highlight guides."""
        # Create guide
        create_response = await client.post(
            "/api/guides",
            json={
                "categoryId": "cat-1",
                "title": "Guide",
                "description": "Test",
            },
            headers=auth_headers,
        )
        guide_id = create_response.json()["id"]

        # Non-admin tries to highlight
        response = await client.patch(
            f"/api/guides/{guide_id}/highlight",
            json={"isHighlighted": True},
            headers=auth_headers,
        )
        assert response.status_code == 403

    async def test_get_my_guides_returns_only_user_guides(
        self, client: AsyncClient, db: AsyncIOMotorDatabase
    ) -> None:
        """Test that my_guides endpoint returns only user's guides."""
        headers = await self._login_user(client, "user@test.com")

        # Create 2 guides
        for i in range(2):
            await client.post(
                "/api/guides",
                json={
                    "categoryId": "cat-1",
                    "title": f"My Guide {i}",
                    "description": "Mine",
                },
                headers=headers,
            )

        # Other user's guides
        other_headers = await self._login_user(client, "other@test.com")
        for i in range(2):
            await client.post(
                "/api/guides",
                json={
                    "categoryId": "cat-1",
                    "title": f"Other Guide {i}",
                    "description": "Theirs",
                },
                headers=other_headers,
            )

        # Get my guides
        response = await client.get(
            "/api/guides?my_guides=true",
            headers=headers,
        )
        assert response.status_code == 200
        guides = response.json()
        assert len(guides) == 2
        assert all("My Guide" in g["title"] for g in guides)

    async def test_get_highlighted_guides_for_homepage(
        self, client: AsyncClient, db: AsyncIOMotorDatabase
    ) -> None:
        """Test that highlighted guides endpoint returns featured guides."""
        # Create regular user
        user_headers = await self._login_user(client, "user@test.com")

        # Create 3 guides: 1 public+highlighted, 1 public only, 1 private
        guide_ids = []
        for i in range(3):
            create_response = await client.post(
                "/api/guides",
                json={
                    "categoryId": "cat-1",
                    "title": f"Guide {i}",
                    "description": "Test",
                },
                headers=user_headers,
            )
            guide_ids.append(create_response.json()["id"])
            if i < 2:  # Make first 2 public
                await client.patch(
                    f"/api/guides/{guide_ids[i]}",
                    json={"isPublic": True},
                    headers=user_headers,
                )

        # Admin highlights first guide
        admin_headers = await self._login_admin(client, "admin@test.com")
        await client.patch(
            f"/api/guides/{guide_ids[0]}/highlight",
            json={"isHighlighted": True},
            headers=admin_headers,
        )

        # Get highlighted guides
        response = await client.get(
            "/api/guides?highlighted=true",
            headers=admin_headers,
        )
        assert response.status_code == 200
        guides = response.json()
        assert len(guides) == 1
        assert guides[0]["isHighlighted"] is True

    # Helper methods
    async def _login_user(
        self, client: AsyncClient, email: str
    ) -> dict[str, str]:
        """Login or register user and return auth headers."""
        response = await client.post(
            "/api/auth/register",
            json={"email": email, "password": "password123"},
        )
        if response.status_code == 409:  # Already exists
            response = await client.post(
                "/api/auth/login",
                json={"email": email, "password": "password123"},
            )
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}"}

    async def _login_admin(
        self, client: AsyncClient, email: str
    ) -> dict[str, str]:
        """Login as admin user and return auth headers."""
        headers = await self._login_user(client, email)
        # Promote to admin (would need special endpoint or direct DB access)
        return headers
