"""Tests for Guide API endpoints."""

from src.presentation.api.models import GuideCreate, GuideResponse, GuideUpdate


class TestGuideModels:
    """Test suite for Guide API models."""

    def test_guide_create_with_is_public(self) -> None:
        """Test GuideCreate model with is_public field."""
        model = GuideCreate(
            guideType="cooking",
            title="Learn Python",
            isPublic=True,
        )

        assert model.guide_type == "cooking"
        assert model.title == "Learn Python"
        assert model.is_public is True

    def test_guide_update_with_visibility(self) -> None:
        """Test GuideUpdate model with visibility fields."""
        model = GuideUpdate(
            isPublic=True,
            isHighlighted=False,
        )

        assert model.is_public is True
        assert model.is_highlighted is False

    def test_guide_response_with_all_fields(self) -> None:
        """Test GuideResponse model includes all new fields."""
        model = GuideResponse(
            id="guide-123",
            guideType="cooking",
            title="Learn Python",
            description="A guide",
            metadata={"ingredients": [{"name": "flour", "quantity": "200", "unit": "g"}]},
            stepIds=[],
            createdByUserId="user-123",
            isPublic=True,
            isHighlighted=False,
            createdAt="2024-01-01T00:00:00Z",
            updatedAt="2024-01-01T00:00:00Z",
        )

        assert model.created_by_user_id == "user-123"
        assert model.is_public is True
        assert model.is_highlighted is False
        assert model.guide_type == "cooking"

    def test_guide_response_with_none_user_id(self) -> None:
        """Test GuideResponse model with legacy guides (no user ID)."""
        model = GuideResponse(
            id="guide-123",
            guideType="general",
            title="Legacy Guide",
            description=None,
            stepIds=[],
            createdByUserId=None,
            isPublic=False,
            isHighlighted=False,
            createdAt="2024-01-01T00:00:00Z",
            updatedAt="2024-01-01T00:00:00Z",
        )

        assert model.created_by_user_id is None
        assert model.is_public is False
        assert model.guide_type == "general"
