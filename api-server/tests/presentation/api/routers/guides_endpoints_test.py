"""Integration tests for guide API endpoint error paths and edge cases."""

import uuid

import pytest
from httpx import AsyncClient
from motor.motor_asyncio import AsyncIOMotorDatabase


@pytest.mark.asyncio
class TestGuideEndpointErrorPaths:
    """Integration tests covering error/authorization paths in guides.py."""

    # ─────────────────────────────────────────────
    # Helpers
    # ─────────────────────────────────────────────

    async def _register_user(
        self, client: AsyncClient, email: str
    ) -> dict[str, str]:
        """Register or login and return auth headers."""
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

    async def _register_admin(
        self, client: AsyncClient, email: str, db: AsyncIOMotorDatabase
    ) -> dict[str, str]:
        """Register a user and promote them to admin."""
        headers = await self._register_user(client, email)
        user_doc = await db.users.find_one({"email": email})
        if user_doc:
            await db.users.update_one(
                {"_id": user_doc["_id"]}, {"$set": {"role": "admin"}}
            )
        return headers

    async def _register_beta(
        self, client: AsyncClient, email: str, db: AsyncIOMotorDatabase
    ) -> dict[str, str]:
        """Register a user and grant beta access.

        MongoDB documents use camelCase field 'isBeta' per the UserMapper.
        """
        headers = await self._register_user(client, email)
        user_doc = await db.users.find_one({"email": email})
        if user_doc:
            await db.users.update_one(
                {"_id": user_doc["_id"]}, {"$set": {"isBeta": True}}
            )
        return headers

    async def _create_guide(
        self,
        client: AsyncClient,
        headers: dict[str, str],
        title: str = "Test Guide",
        is_public: bool = False,
    ) -> str:
        """Create a guide and return its ID."""
        response = await client.post(
            "/api/v1/guides",
            json={
                "guideType": "general",
                "title": title,
                "description": "Desc",
                "isPublic": is_public,
            },
            headers=headers,
        )
        assert response.status_code == 201
        return response.json()["id"]

    # ─────────────────────────────────────────────
    # GET /guides/{guide_id} — error paths
    # ─────────────────────────────────────────────

    async def test_get_guide_not_found_returns_404(
        self, client: AsyncClient
    ) -> None:
        """Test that fetching a non-existent guide returns 404."""
        headers = await self._register_user(client, "guide_get_404@test.com")
        response = await client.get(
            f"/api/v1/guides/{uuid.uuid4()}", headers=headers
        )
        assert response.status_code == 404

    async def test_get_private_guide_by_other_user_returns_404(
        self, client: AsyncClient
    ) -> None:
        """Test that fetching another user's private guide returns 404."""
        owner = await self._register_user(client, "guide_owner_priv@test.com")
        guide_id = await self._create_guide(client, owner, "Private Guide", False)

        other = await self._register_user(client, "guide_other_priv@test.com")
        response = await client.get(f"/api/v1/guides/{guide_id}", headers=other)
        assert response.status_code == 404

    # ─────────────────────────────────────────────
    # PATCH /guides/{guide_id} — error paths
    # ─────────────────────────────────────────────

    async def test_update_guide_not_found_returns_404(
        self, client: AsyncClient
    ) -> None:
        """Test that updating a non-existent guide returns 404."""
        headers = await self._register_user(client, "guide_upd_404@test.com")
        response = await client.patch(
            f"/api/v1/guides/{uuid.uuid4()}",
            json={"title": "New Title"},
            headers=headers,
        )
        assert response.status_code == 404

    async def test_update_others_private_guide_returns_403(
        self, client: AsyncClient
    ) -> None:
        """Test that updating another user's private guide returns 403."""
        owner = await self._register_user(client, "guide_upd_owner@test.com")
        guide_id = await self._create_guide(client, owner, "Owner Guide", False)

        other = await self._register_user(client, "guide_upd_other@test.com")
        response = await client.patch(
            f"/api/v1/guides/{guide_id}",
            json={"title": "Hijacked"},
            headers=other,
        )
        assert response.status_code == 403

    # ─────────────────────────────────────────────
    # DELETE /guides/{guide_id} — error paths
    # ─────────────────────────────────────────────

    async def test_delete_guide_not_found_returns_404(
        self, client: AsyncClient
    ) -> None:
        """Test that deleting a non-existent guide returns 404."""
        headers = await self._register_user(client, "guide_del_404@test.com")
        response = await client.delete(
            f"/api/v1/guides/{uuid.uuid4()}", headers=headers
        )
        assert response.status_code == 404

    async def test_delete_others_guide_returns_403(
        self, client: AsyncClient
    ) -> None:
        """Test that deleting another user's guide returns 403."""
        owner = await self._register_user(client, "guide_del_owner@test.com")
        guide_id = await self._create_guide(client, owner, "Owner Guide Del", False)

        other = await self._register_user(client, "guide_del_other@test.com")
        response = await client.delete(
            f"/api/v1/guides/{guide_id}", headers=other
        )
        assert response.status_code == 403

    # ─────────────────────────────────────────────
    # PATCH /guides/{guide_id}/highlight — error paths
    # ─────────────────────────────────────────────

    async def test_highlight_nonexistent_guide_returns_404(
        self, client: AsyncClient, db: AsyncIOMotorDatabase
    ) -> None:
        """Test that highlighting a non-existent guide returns 404."""
        admin = await self._register_admin(client, "guide_hl_404@test.com", db)
        response = await client.patch(
            f"/api/v1/guides/{uuid.uuid4()}/highlight",
            json={"isHighlighted": True},
            headers=admin,
        )
        assert response.status_code == 404

    async def test_highlight_guide_non_admin_returns_403(
        self, client: AsyncClient
    ) -> None:
        """Test that a non-admin cannot highlight a guide."""
        owner = await self._register_user(client, "guide_hl_owner@test.com")
        guide_id = await self._create_guide(client, owner, "HL Guide", True)

        other = await self._register_user(client, "guide_hl_other@test.com")
        response = await client.patch(
            f"/api/v1/guides/{guide_id}/highlight",
            json={"isHighlighted": True},
            headers=other,
        )
        assert response.status_code == 403

    # ─────────────────────────────────────────────
    # GET /guides/my  (dependency provider exercise)
    # ─────────────────────────────────────────────

    async def test_get_my_guides_returns_only_my_guides(
        self, client: AsyncClient
    ) -> None:
        """Test that /guides/my returns only the current user's guides."""
        headers = await self._register_user(client, "my_guides_user@test.com")
        await self._create_guide(client, headers, "My Guide 1")
        await self._create_guide(client, headers, "My Guide 2")

        response = await client.get("/api/v1/guides/my", headers=headers)
        assert response.status_code == 200
        guides = response.json()
        assert len(guides) >= 2
        assert all(g["title"].startswith("My Guide") for g in guides)

    async def test_get_my_guides_requires_authentication(
        self, client: AsyncClient
    ) -> None:
        """Test that /guides/my without auth returns 401."""
        response = await client.get("/api/v1/guides/my")
        assert response.status_code == 401

    # ─────────────────────────────────────────────
    # GET /guides/highlighted  (dependency provider exercise)
    # ─────────────────────────────────────────────

    async def test_get_highlighted_guides_returns_list(
        self, client: AsyncClient
    ) -> None:
        """Test that /guides/highlighted returns a list (empty or filled)."""
        response = await client.get("/api/v1/guides/highlighted")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    # ─────────────────────────────────────────────
    # POST /guides/{guide_id}/copy  (beta endpoint)
    # ─────────────────────────────────────────────

    async def test_copy_guide_requires_beta_access(
        self, client: AsyncClient
    ) -> None:
        """Test that copying a guide without beta access returns 403."""
        headers = await self._register_user(client, "copy_nobeta@test.com")
        guide_id = await self._create_guide(client, headers, "Copy Guide", True)

        response = await client.post(
            f"/api/v1/guides/{guide_id}/copy",
            json={"targetLanguage": "nl"},
            headers=headers,
        )
        assert response.status_code == 403

    async def test_copy_nonexistent_guide_returns_404(
        self, client: AsyncClient, db: AsyncIOMotorDatabase
    ) -> None:
        """Test that copying a non-existent guide returns 404 for beta users."""
        beta_headers = await self._register_beta(
            client, "copy_beta_404@test.com", db
        )
        response = await client.post(
            f"/api/v1/guides/{uuid.uuid4()}/copy",
            json={"targetLanguage": "nl"},
            headers=beta_headers,
        )
        assert response.status_code == 404

    async def test_copy_guide_with_invalid_language_returns_400(
        self, client: AsyncClient, db: AsyncIOMotorDatabase
    ) -> None:
        """Test that copying a guide with an invalid language code returns 400."""
        beta_headers = await self._register_beta(
            client, "copy_beta_badlang@test.com", db
        )
        guide_id = await self._create_guide(client, beta_headers, "Bad Lang Guide", True)

        # An invalid language code should raise ValueError (mapped to 400)
        response = await client.post(
            f"/api/v1/guides/{guide_id}/copy",
            json={"targetLanguage": "xx-invalid-lang"},
            headers=beta_headers,
        )
        assert response.status_code == 400

    async def test_copy_guide_to_new_language_returns_201(
        self, client: AsyncClient, db: AsyncIOMotorDatabase
    ) -> None:
        """Test that a beta user can copy a guide to a new language."""
        beta_headers = await self._register_beta(
            client, "copy_beta_ok@test.com", db
        )
        guide_id = await self._create_guide(client, beta_headers, "Copy OK Guide", True)

        # Add a step so there's something to copy
        await client.post(
            "/api/v1/steps",
            json={
                "guideId": guide_id,
                "order": 1,
                "title": "Step 1",
                "description": "Step desc",
            },
            headers=beta_headers,
        )

        response = await client.post(
            f"/api/v1/guides/{guide_id}/copy",
            json={"targetLanguage": "nl"},
            headers=beta_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert "guide" in data
        assert "steps" in data
        assert data["guide"]["language"] == "nl"

    # ─────────────────────────────────────────────
    # POST /guides/{guide_id}/translate  (beta, LLM)
    # ─────────────────────────────────────────────

    async def test_translate_guide_requires_beta_access(
        self, client: AsyncClient
    ) -> None:
        """Test that translating a guide without beta access returns 403."""
        headers = await self._register_user(client, "trans_nobeta@test.com")
        guide_id = await self._create_guide(client, headers, "Trans Guide", True)

        response = await client.post(
            f"/api/v1/guides/{guide_id}/translate",
            json={"targetLanguage": "nl"},
            headers=headers,
        )
        assert response.status_code == 403

    async def test_translate_nonexistent_guide_returns_404(
        self, client: AsyncClient, db: AsyncIOMotorDatabase
    ) -> None:
        """Test that translating a non-existent guide returns 404 for beta users."""
        beta_headers = await self._register_beta(
            client, "trans_beta_404@test.com", db
        )
        response = await client.post(
            f"/api/v1/guides/{uuid.uuid4()}/translate",
            json={"targetLanguage": "nl"},
            headers=beta_headers,
        )
        assert response.status_code == 404

    async def test_translate_guide_with_invalid_language_returns_400(
        self, client: AsyncClient, db: AsyncIOMotorDatabase
    ) -> None:
        """Test that translating a guide with an invalid language code returns 400."""
        beta_headers = await self._register_beta(
            client, "trans_beta_badlang@test.com", db
        )
        guide_id = await self._create_guide(
            client, beta_headers, "Trans Bad Lang Guide", True
        )

        # An invalid language code triggers ValueError in Language() → 400
        response = await client.post(
            f"/api/v1/guides/{guide_id}/translate",
            json={"targetLanguage": "xx-invalid"},
            headers=beta_headers,
        )
        assert response.status_code == 400
