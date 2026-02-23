"""Tests for guides router ownership endpoints."""

from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from src.application.dtos import GuideResponseDTO
from src.domain.entities import User
from src.domain.value_objects import Email, EntityId
from src.main import create_application
from src.presentation.api.dependencies.auth import get_current_user
from src.presentation.api.routers.guides import (
    get_get_highlighted_guides_use_case,
    get_get_my_guides_use_case,
)


def _make_user(is_admin: bool = False) -> User:
    return User(
        id=EntityId(str(uuid4())),
        email=Email("user@example.com"),
        password_hash="$argon2id$v=19$m=65536,t=3,p=4$...",
        is_admin=is_admin,
    )


def _make_guide_dto(
    user_id: str | None = None, is_highlighted: bool = False
) -> GuideResponseDTO:
    return GuideResponseDTO(
        id=str(uuid4()),
        guide_type="cooking",
        title="Test Guide",
        description=None,
        metadata=None,
        step_ids=[],
        created_by_user_id=user_id,
        is_public=True,
        is_highlighted=is_highlighted,
        created_at="2026-01-01T00:00:00",
        updated_at="2026-01-01T00:00:00",
    )


@pytest.fixture
def app():
    return create_application()


class TestGetMyGuidesEndpoint:
    """Tests for GET /api/v1/guides/my"""

    def test_returns_users_guides(self, app):
        """Authenticated user receives their own guides."""
        user = _make_user()
        mock_use_case = AsyncMock()
        mock_use_case.execute.return_value = [_make_guide_dto(user.id.value)]

        app.dependency_overrides[get_current_user] = lambda: user
        app.dependency_overrides[get_get_my_guides_use_case] = lambda: mock_use_case

        response = TestClient(app).get("/api/v1/guides/my")

        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["title"] == "Test Guide"

    def test_requires_authentication(self, app):
        """Unauthenticated request is rejected with 401.

        The use case dependency is still mocked because FastAPI resolves all
        Depends() in parallel — even when auth fails the use case is instantiated.
        The 401 is enforced by the OAuth2 scheme before the endpoint handler runs.
        """
        mock_use_case = AsyncMock()
        app.dependency_overrides[get_get_my_guides_use_case] = lambda: mock_use_case

        response = TestClient(app).get("/api/v1/guides/my")

        assert response.status_code == 401
        mock_use_case.execute.assert_not_called()

    def test_calls_use_case_with_current_user(self, app):
        """Use case receives the authenticated user object."""
        user = _make_user()
        mock_use_case = AsyncMock()
        mock_use_case.execute.return_value = []

        app.dependency_overrides[get_current_user] = lambda: user
        app.dependency_overrides[get_get_my_guides_use_case] = lambda: mock_use_case

        TestClient(app).get("/api/v1/guides/my")

        mock_use_case.execute.assert_called_once_with(user)

    def test_returns_empty_list_when_no_guides(self, app):
        """Returns empty list when user has no guides."""
        user = _make_user()
        mock_use_case = AsyncMock()
        mock_use_case.execute.return_value = []

        app.dependency_overrides[get_current_user] = lambda: user
        app.dependency_overrides[get_get_my_guides_use_case] = lambda: mock_use_case

        response = TestClient(app).get("/api/v1/guides/my")

        assert response.status_code == 200
        assert response.json() == []


class TestGetHighlightedGuidesEndpoint:
    """Tests for GET /api/v1/guides/highlighted"""

    def test_returns_highlighted_guides(self, app):
        """Returns highlighted guides without requiring authentication."""
        mock_use_case = AsyncMock()
        mock_use_case.execute.return_value = [_make_guide_dto(is_highlighted=True)]

        app.dependency_overrides[get_get_highlighted_guides_use_case] = (
            lambda: mock_use_case
        )

        response = TestClient(app).get("/api/v1/guides/highlighted")

        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["isHighlighted"] is True

    def test_accessible_without_authentication(self, app):
        """Endpoint is publicly accessible (no Bearer token needed)."""
        mock_use_case = AsyncMock()
        mock_use_case.execute.return_value = []

        app.dependency_overrides[get_get_highlighted_guides_use_case] = (
            lambda: mock_use_case
        )

        # Explicitly no auth header
        response = TestClient(app).get("/api/v1/guides/highlighted")

        assert response.status_code == 200

    def test_calls_use_case_without_args(self, app):
        """Use case is called with no arguments."""
        mock_use_case = AsyncMock()
        mock_use_case.execute.return_value = []

        app.dependency_overrides[get_get_highlighted_guides_use_case] = (
            lambda: mock_use_case
        )

        TestClient(app).get("/api/v1/guides/highlighted")

        mock_use_case.execute.assert_called_once_with()
