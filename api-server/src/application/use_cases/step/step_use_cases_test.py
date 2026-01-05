"""Tests for Step use cases."""

from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from src.application.dtos import StepCreateDTO, StepUpdateDTO
from src.application.use_cases.step import (
    CreateStep,
    GetStepsByGuide,
    UpdateStep,
)
from src.domain.entities import Guide, Step
from src.domain.exceptions import EntityNotFoundException, ValidationException
from src.domain.value_objects import EntityId, GuideTitle, StepDuration


@pytest.fixture
def mock_step_repository():
    """Create mock step repository."""
    return AsyncMock()


@pytest.fixture
def mock_guide_repository():
    """Create mock guide repository."""
    return AsyncMock()


@pytest.fixture
def sample_guide():
    """Create a sample guide."""
    return Guide(
        id=EntityId(str(uuid4())),
        category_id=EntityId(str(uuid4())),
        title=GuideTitle("Test Guide"),
    )


@pytest.fixture
def sample_step(sample_guide):
    """Create a sample step."""
    return Step(
        id=EntityId(str(uuid4())),
        guide_id=sample_guide.id,
        order=1,
        title="Test Step",
        description="Test Description",
        duration=StepDuration(60),
    )


class TestCreateStep:
    """Tests for CreateStep use case."""

    async def test_create_step_success(
        self, mock_step_repository, mock_guide_repository, sample_guide
    ):
        """Test successful step creation."""
        mock_guide_repository.find_by_id.return_value = sample_guide
        use_case = CreateStep(mock_step_repository, mock_guide_repository)
        dto = StepCreateDTO(
            guide_id=sample_guide.id.value,
            order=1,
            title="New Step",
            description="Description",
            duration=60,
        )

        result = await use_case.execute(dto)

        assert result.title == "New Step"
        assert result.guide_id == sample_guide.id.value
        assert result.order == 1
        assert result.duration == 60
        mock_step_repository.save.assert_called_once()

    async def test_create_step_invalid_guide(
        self, mock_step_repository, mock_guide_repository
    ):
        """Test creating step with non-existent guide."""
        mock_guide_repository.find_by_id.return_value = None
        use_case = CreateStep(mock_step_repository, mock_guide_repository)
        dto = StepCreateDTO(
            guide_id=str(uuid4()),
            order=1,
            title="New Step",
        )

        with pytest.raises(ValidationException, match="Guide not found"):
            await use_case.execute(dto)


class TestGetStepsByGuide:
    """Tests for GetStepsByGuide use case."""

    async def test_get_steps_by_guide(
        self, mock_step_repository, sample_step, sample_guide
    ):
        """Test getting steps by guide."""
        mock_step_repository.find_by_guide_id.return_value = [sample_step]
        use_case = GetStepsByGuide(mock_step_repository)

        result = await use_case.execute(sample_guide.id.value)

        assert len(result) == 1
        assert result[0].guide_id == sample_guide.id.value


class TestUpdateStep:
    """Tests for UpdateStep use case."""

    async def test_update_step_all_fields(self, mock_step_repository, sample_step):
        """Test updating all step fields."""
        mock_step_repository.find_by_id.return_value = sample_step
        use_case = UpdateStep(mock_step_repository)
        dto = StepUpdateDTO(
            order=2,
            title="Updated Title",
            description="Updated Description",
            duration=120,
        )

        result = await use_case.execute(sample_step.id.value, dto)

        assert result.order == 2
        assert result.title == "Updated Title"
        assert result.description == "Updated Description"
        assert result.duration == 120
        mock_step_repository.save.assert_called_once()

    async def test_update_step_not_found(self, mock_step_repository):
        """Test updating non-existent step."""
        mock_step_repository.find_by_id.return_value = None
        use_case = UpdateStep(mock_step_repository)
        dto = StepUpdateDTO(title="Updated Title")

        with pytest.raises(EntityNotFoundException, match="Step not found"):
            await use_case.execute(str(uuid4()), dto)
