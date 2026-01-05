"""Tests for Guide use cases."""

from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from src.application.dtos import GuideCreateDTO, GuideUpdateDTO
from src.application.use_cases.guide import (
    CreateGuide,
    DeleteGuide,
    GetAllGuides,
    GetGuide,
    GetGuidesByCategory,
    UpdateGuide,
)
from src.domain.entities import Category, Guide
from src.domain.exceptions import EntityNotFoundException, ValidationException
from src.domain.value_objects import EntityId, GuideTitle


@pytest.fixture
def mock_guide_repository():
    """Create mock guide repository."""
    return AsyncMock()


@pytest.fixture
def mock_category_repository():
    """Create mock category repository."""
    return AsyncMock()


@pytest.fixture
def sample_category():
    """Create a sample category."""
    return Category(
        id=EntityId(str(uuid4())),
        name="Test Category",
    )


@pytest.fixture
def sample_guide(sample_category):
    """Create a sample guide."""
    return Guide(
        id=EntityId(str(uuid4())),
        category_id=sample_category.id,
        title=GuideTitle("Test Guide"),
        description="Test Description",
    )


class TestCreateGuide:
    """Tests for CreateGuide use case."""

    async def test_create_guide_success(
        self, mock_guide_repository, mock_category_repository, sample_category
    ):
        """Test successful guide creation."""
        mock_category_repository.find_by_id.return_value = sample_category
        use_case = CreateGuide(mock_guide_repository, mock_category_repository)
        dto = GuideCreateDTO(
            category_id=sample_category.id.value,
            title="New Guide",
            description="Description",
        )

        result = await use_case.execute(dto)

        assert result.title == "New Guide"
        assert result.category_id == sample_category.id.value
        assert result.id is not None
        mock_guide_repository.save.assert_called_once()

    async def test_create_guide_invalid_category(
        self, mock_guide_repository, mock_category_repository
    ):
        """Test creating guide with non-existent category."""
        mock_category_repository.find_by_id.return_value = None
        use_case = CreateGuide(mock_guide_repository, mock_category_repository)
        dto = GuideCreateDTO(
            category_id=str(uuid4()),
            title="New Guide",
        )

        with pytest.raises(ValidationException, match="Category not found"):
            await use_case.execute(dto)


class TestGetGuide:
    """Tests for GetGuide use case."""

    async def test_get_guide_success(self, mock_guide_repository, sample_guide):
        """Test getting existing guide."""
        mock_guide_repository.find_by_id.return_value = sample_guide
        use_case = GetGuide(mock_guide_repository)

        result = await use_case.execute(sample_guide.id.value)

        assert result is not None
        assert result.id == sample_guide.id.value
        assert result.title == sample_guide.title.value

    async def test_get_guide_not_found(self, mock_guide_repository):
        """Test getting non-existent guide."""
        mock_guide_repository.find_by_id.return_value = None
        use_case = GetGuide(mock_guide_repository)

        result = await use_case.execute(str(uuid4()))

        assert result is None


class TestGetAllGuides:
    """Tests for GetAllGuides use case."""

    async def test_get_all_guides(self, mock_guide_repository, sample_guide):
        """Test getting all guides."""
        mock_guide_repository.find_all.return_value = [sample_guide]
        use_case = GetAllGuides(mock_guide_repository)

        result = await use_case.execute()

        assert len(result) == 1
        assert result[0].id == sample_guide.id.value


class TestGetGuidesByCategory:
    """Tests for GetGuidesByCategory use case."""

    async def test_get_guides_by_category(
        self, mock_guide_repository, sample_guide, sample_category
    ):
        """Test getting guides by category."""
        mock_guide_repository.find_by_category_id.return_value = [sample_guide]
        use_case = GetGuidesByCategory(mock_guide_repository)

        result = await use_case.execute(sample_category.id.value)

        assert len(result) == 1
        assert result[0].category_id == sample_category.id.value


class TestUpdateGuide:
    """Tests for UpdateGuide use case."""

    async def test_update_guide_title(self, mock_guide_repository, sample_guide):
        """Test updating guide title."""
        mock_guide_repository.find_by_id.return_value = sample_guide
        use_case = UpdateGuide(mock_guide_repository)
        dto = GuideUpdateDTO(title="Updated Title")

        result = await use_case.execute(sample_guide.id.value, dto)

        assert result.title == "Updated Title"
        mock_guide_repository.save.assert_called_once()

    async def test_update_guide_not_found(self, mock_guide_repository):
        """Test updating non-existent guide."""
        mock_guide_repository.find_by_id.return_value = None
        use_case = UpdateGuide(mock_guide_repository)
        dto = GuideUpdateDTO(title="Updated Title")

        with pytest.raises(EntityNotFoundException, match="Guide not found"):
            await use_case.execute(str(uuid4()), dto)


class TestDeleteGuide:
    """Tests for DeleteGuide use case."""

    async def test_delete_guide(self, mock_guide_repository):
        """Test deleting a guide."""
        use_case = DeleteGuide(mock_guide_repository)
        guide_id = str(uuid4())

        await use_case.execute(guide_id)

        mock_guide_repository.delete.assert_called_once()
