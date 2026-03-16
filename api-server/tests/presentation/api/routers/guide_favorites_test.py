"""Integration tests for guide favorites API endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestGuideFavoritesEndpoints:
    """Integration tests for /guide-favorites endpoints."""

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
        self, client: AsyncClient, headers: dict[str, str], title: str = "Test Guide"
    ) -> str:
        """Create a guide and return its ID."""
        response = await client.post(
            "/api/v1/guides",
            json={"guideType": "general", "title": title, "description": "Desc"},
            headers=headers,
        )
        assert response.status_code == 201
        return response.json()["id"]

    # ─────────────────────────────────────────────
    # GET /guide-favorites
    # ─────────────────────────────────────────────

    async def test_get_favorites_returns_empty_list_initially(
        self, client: AsyncClient
    ) -> None:
        """Test that a new user has no favorites."""
        headers = await self._register_user(client, "fav_get_empty@test.com")
        response = await client.get("/api/v1/guide-favorites", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "guideIds" in data
        assert data["guideIds"] == []

    async def test_get_favorites_requires_authentication(
        self, client: AsyncClient
    ) -> None:
        """Test that unauthenticated request returns 401."""
        response = await client.get("/api/v1/guide-favorites")
        assert response.status_code == 401

    # ─────────────────────────────────────────────
    # POST /guide-favorites/guides/{guide_id}
    # ─────────────────────────────────────────────

    async def test_favorite_guide_returns_201(
        self, client: AsyncClient
    ) -> None:
        """Test that favoriting a guide returns 201."""
        headers = await self._register_user(client, "fav_post@test.com")
        guide_id = await self._create_guide(client, headers, "Fav Guide")

        response = await client.post(
            f"/api/v1/guide-favorites/guides/{guide_id}",
            headers=headers,
        )
        assert response.status_code == 201

    async def test_favorited_guide_appears_in_list(
        self, client: AsyncClient
    ) -> None:
        """Test that a favorited guide appears in the favorites list."""
        headers = await self._register_user(client, "fav_list@test.com")
        guide_id = await self._create_guide(client, headers, "Listed Fav")

        await client.post(
            f"/api/v1/guide-favorites/guides/{guide_id}",
            headers=headers,
        )

        response = await client.get("/api/v1/guide-favorites", headers=headers)
        assert response.status_code == 200
        assert guide_id in response.json()["guideIds"]

    async def test_favorite_guide_requires_authentication(
        self, client: AsyncClient
    ) -> None:
        """Test that unauthenticated favorite request returns 401."""
        response = await client.post(
            "/api/v1/guide-favorites/guides/some-guide-id"
        )
        assert response.status_code == 401

    async def test_favoriting_same_guide_twice_is_idempotent(
        self, client: AsyncClient
    ) -> None:
        """Test that favoriting a guide twice does not duplicate the entry."""
        headers = await self._register_user(client, "fav_dupe@test.com")
        guide_id = await self._create_guide(client, headers, "Dupe Fav")

        await client.post(
            f"/api/v1/guide-favorites/guides/{guide_id}",
            headers=headers,
        )
        await client.post(
            f"/api/v1/guide-favorites/guides/{guide_id}",
            headers=headers,
        )

        response = await client.get("/api/v1/guide-favorites", headers=headers)
        guide_ids = response.json()["guideIds"]
        assert guide_ids.count(guide_id) == 1

    # ─────────────────────────────────────────────
    # DELETE /guide-favorites/guides/{guide_id}
    # ─────────────────────────────────────────────

    async def test_unfavorite_guide_returns_204(
        self, client: AsyncClient
    ) -> None:
        """Test that unfavoriting a guide returns 204."""
        headers = await self._register_user(client, "fav_del@test.com")
        guide_id = await self._create_guide(client, headers, "Del Fav")

        await client.post(
            f"/api/v1/guide-favorites/guides/{guide_id}",
            headers=headers,
        )

        response = await client.delete(
            f"/api/v1/guide-favorites/guides/{guide_id}",
            headers=headers,
        )
        assert response.status_code == 204

    async def test_unfavorited_guide_disappears_from_list(
        self, client: AsyncClient
    ) -> None:
        """Test that unfavoriting removes the guide from favorites list."""
        headers = await self._register_user(client, "fav_remove@test.com")
        guide_id = await self._create_guide(client, headers, "Remove Fav")

        await client.post(
            f"/api/v1/guide-favorites/guides/{guide_id}",
            headers=headers,
        )
        await client.delete(
            f"/api/v1/guide-favorites/guides/{guide_id}",
            headers=headers,
        )

        response = await client.get("/api/v1/guide-favorites", headers=headers)
        assert guide_id not in response.json()["guideIds"]

    async def test_unfavorite_guide_requires_authentication(
        self, client: AsyncClient
    ) -> None:
        """Test that unauthenticated unfavorite request returns 401."""
        response = await client.delete(
            "/api/v1/guide-favorites/guides/some-guide-id"
        )
        assert response.status_code == 401

    async def test_favorites_are_per_user(
        self, client: AsyncClient
    ) -> None:
        """Test that favorites are isolated per user."""
        user1_headers = await self._register_user(client, "fav_user1@test.com")
        user2_headers = await self._register_user(client, "fav_user2@test.com")

        # User 1 creates and favorites a guide
        guide_id = await self._create_guide(client, user1_headers, "User1 Guide")
        await client.post(
            f"/api/v1/guide-favorites/guides/{guide_id}",
            headers=user1_headers,
        )

        # User 2 should not see user 1's favorites
        response = await client.get("/api/v1/guide-favorites", headers=user2_headers)
        assert guide_id not in response.json()["guideIds"]
