"""Tests for Guide DTOs."""

from src.application.dtos.guide_dtos import (
    GuideCreateDTO,
    GuideResponseDTO,
    GuideUpdateDTO,
)


class TestGuideCreateDTO:
    """Test suite for GuideCreateDTO."""

    def test_create_with_minimal_fields(self) -> None:
        """Test creating DTO with minimal fields."""
        dto = GuideCreateDTO(
            guide_type="general",
            title="Learn Python",
        )

        assert dto.guide_type == "general"
        assert dto.title == "Learn Python"
        assert dto.description is None
        assert dto.is_public is False

    def test_create_with_all_fields(self) -> None:
        """Test creating DTO with all fields."""
        dto = GuideCreateDTO(
            guide_type="cooking",
            title="Learn Python",
            description="A guide to Python",
            metadata={"ingredients": [{"name": "flour", "quantity": "200", "unit": "g"}]},
            is_public=True,
        )

        assert dto.guide_type == "cooking"
        assert dto.title == "Learn Python"
        assert dto.description == "A guide to Python"
        assert dto.metadata == {"ingredients": [{"name": "flour", "quantity": "200", "unit": "g"}]}
        assert dto.is_public is True


class TestGuideUpdateDTO:
    """Test suite for GuideUpdateDTO."""

    def test_update_title_only(self) -> None:
        """Test updating only title."""
        dto = GuideUpdateDTO(title="Updated Title")

        assert dto.title == "Updated Title"
        assert dto.description is None
        assert dto.is_public is None
        assert dto.is_highlighted is None

    def test_update_visibility(self) -> None:
        """Test updating visibility."""
        dto = GuideUpdateDTO(is_public=True)

        assert dto.is_public is True
        assert dto.title is None
        assert dto.description is None
        assert dto.is_highlighted is None

    def test_update_highlight(self) -> None:
        """Test updating highlight (admin-only)."""
        dto = GuideUpdateDTO(is_highlighted=True)

        assert dto.is_highlighted is True
        assert dto.title is None


class TestGuideResponseDTO:
    """Test suite for GuideResponseDTO."""

    def test_response_with_all_fields(self) -> None:
        """Test response DTO with all fields."""
        dto = GuideResponseDTO(
            id="guide-123",
            guide_type="cooking",
            title="Learn Python",
            description="A guide to Python",
            metadata={"ingredients": [{"name": "flour", "quantity": "200", "unit": "g"}]},
            step_ids=["step-1", "step-2"],
            created_by_user_id="user-123",
            is_public=True,
            is_highlighted=False,
            created_at="2024-01-01T00:00:00Z",
            updated_at="2024-01-02T00:00:00Z",
        )

        assert dto.id == "guide-123"
        assert dto.guide_type == "cooking"
        assert dto.title == "Learn Python"
        assert dto.description == "A guide to Python"
        assert dto.metadata == {"ingredients": [{"name": "flour", "quantity": "200", "unit": "g"}]}
        assert dto.step_ids == ["step-1", "step-2"]
        assert dto.created_by_user_id == "user-123"
        assert dto.is_public is True
        assert dto.is_highlighted is False
        assert dto.created_at == "2024-01-01T00:00:00Z"
        assert dto.updated_at == "2024-01-02T00:00:00Z"

    def test_response_with_minimal_fields(self) -> None:
        """Test response DTO with minimal fields."""
        dto = GuideResponseDTO(
            id="guide-123",
            guide_type="general",
            title="Learn Python",
            description=None,
            metadata=None,
            step_ids=[],
            created_by_user_id=None,
            is_public=False,
            is_highlighted=False,
            created_at="2024-01-01T00:00:00Z",
            updated_at="2024-01-02T00:00:00Z",
        )

        assert dto.id == "guide-123"
        assert dto.guide_type == "general"
        assert dto.title == "Learn Python"
        assert dto.description is None
        assert dto.metadata is None
        assert dto.step_ids == []
        assert dto.created_by_user_id is None
        assert dto.is_public is False
        assert dto.is_highlighted is False
