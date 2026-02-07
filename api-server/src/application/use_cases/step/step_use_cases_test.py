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
from src.domain.entities import Guide, Step, User
from src.domain.exceptions import (
    AuthorizationException,
    EntityNotFoundException,
    ValidationException,
)
from src.domain.value_objects import Email, EntityId, GuideTitle, StepDuration


@pytest.fixture
def mock_step_repository():
    """Create mock step repository."""
    return AsyncMock()


@pytest.fixture
def mock_guide_repository():
    """Create mock guide repository."""
    return AsyncMock()


@pytest.fixture
def sample_user():
    """Create a sample user."""
    return User(
        id=EntityId(str(uuid4())),
        email=Email("test@example.com"),
        password_hash="hashed_password",
        name="Test User",
    )


@pytest.fixture
def sample_admin():
    """Create a sample admin user."""
    return User(
        id=EntityId(str(uuid4())),
        email=Email("admin@example.com"),
        password_hash="hashed_password",
        name="Admin User",
        is_admin=True,
    )


@pytest.fixture
def sample_guide(sample_user):
    """Create a sample guide."""
    return Guide(
        id=EntityId(str(uuid4())),
        category_id=EntityId(str(uuid4())),
        title=GuideTitle("Test Guide"),
        created_by_user_id=sample_user.id,
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
        self, mock_step_repository, mock_guide_repository, sample_guide, sample_user
    ):
        """Test successful step creation by guide owner."""
        mock_guide_repository.find_by_id.return_value = sample_guide
        use_case = CreateStep(mock_step_repository, mock_guide_repository)
        dto = StepCreateDTO(
            guide_id=sample_guide.id.value,
            order=1,
            title="New Step",
            description="Description",
            duration=60,
        )

        result = await use_case.execute(dto, sample_user)

        assert result.title == "New Step"
        assert result.guide_id == sample_guide.id.value
        assert result.order == 1
        assert result.duration == 60
        mock_step_repository.save.assert_called_once()

    async def test_create_step_by_admin(
        self, mock_step_repository, mock_guide_repository, sample_guide, sample_admin
    ):
        """Test admin can create step for other user's guide."""
        mock_guide_repository.find_by_id.return_value = sample_guide
        use_case = CreateStep(mock_step_repository, mock_guide_repository)
        dto = StepCreateDTO(
            guide_id=sample_guide.id.value,
            order=1,
            title="New Step",
            description="Description",
        )

        result = await use_case.execute(dto, sample_admin)

        assert result.title == "New Step"
        mock_step_repository.save.assert_called_once()

    async def test_create_step_unauthorized(
        self, mock_step_repository, mock_guide_repository, sample_guide
    ):
        """Test non-owner cannot create step in other's guide."""
        other_user = User(
            id=EntityId(str(uuid4())),
            email=Email("other@example.com"),
            password_hash="hashed",
        )
        mock_guide_repository.find_by_id.return_value = sample_guide
        use_case = CreateStep(mock_step_repository, mock_guide_repository)
        dto = StepCreateDTO(
            guide_id=sample_guide.id.value,
            order=1,
            title="New Step",
        )

        with pytest.raises(AuthorizationException):
            await use_case.execute(dto, other_user)

    async def test_create_step_invalid_guide(
        self, mock_step_repository, mock_guide_repository, sample_user
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
            await use_case.execute(dto, sample_user)


class TestGetStepsByGuide:
    """Tests for GetStepsByGuide use case."""

    async def test_get_steps_by_guide_public(
        self, mock_step_repository, mock_guide_repository, sample_step, sample_guide
    ):
        """Test getting steps from public guide."""
        sample_guide.make_public()
        mock_step_repository.find_by_guide_id.return_value = [sample_step]
        mock_guide_repository.find_by_id.return_value = sample_guide
        use_case = GetStepsByGuide(mock_step_repository, mock_guide_repository)

        result = await use_case.execute(sample_guide.id.value, current_user=None)

        assert len(result) == 1
        assert result[0].guide_id == sample_guide.id.value

    async def test_get_steps_by_guide_private_owner(
        self, mock_step_repository, mock_guide_repository, sample_step, sample_guide, sample_user
    ):
        """Test owner can get steps from their private guide."""
        sample_guide.make_private()
        mock_step_repository.find_by_guide_id.return_value = [sample_step]
        mock_guide_repository.find_by_id.return_value = sample_guide
        use_case = GetStepsByGuide(mock_step_repository, mock_guide_repository)

        result = await use_case.execute(sample_guide.id.value, current_user=sample_user)

        assert len(result) == 1

    async def test_get_steps_by_guide_private_unauthorized(
        self, mock_step_repository, mock_guide_repository, sample_guide
    ):
        """Test non-owner cannot get steps from private guide."""
        other_user = User(
            id=EntityId(str(uuid4())),
            email=Email("other@example.com"),
            password_hash="hashed",
        )
        sample_guide.make_private()
        mock_guide_repository.find_by_id.return_value = sample_guide
        use_case = GetStepsByGuide(mock_step_repository, mock_guide_repository)

        with pytest.raises(AuthorizationException):
            await use_case.execute(sample_guide.id.value, current_user=other_user)


class TestUpdateStep:
    """Tests for UpdateStep use case."""

    async def test_update_step_all_fields(
        self, mock_step_repository, mock_guide_repository, sample_step, sample_guide, sample_user
    ):
        """Test updating all step fields by guide owner."""
        mock_step_repository.find_by_id.return_value = sample_step
        mock_guide_repository.find_by_id.return_value = sample_guide
        use_case = UpdateStep(mock_step_repository, mock_guide_repository)
        dto = StepUpdateDTO(
            order=2,
            title="Updated Title",
            description="Updated Description",
            duration=120,
        )

        result = await use_case.execute(sample_step.id.value, dto, sample_user)

        assert result.order == 2
        assert result.title == "Updated Title"
        assert result.description == "Updated Description"
        assert result.duration == 120
        mock_step_repository.save.assert_called_once()

    async def test_update_step_unauthorized(
        self, mock_step_repository, mock_guide_repository, sample_step, sample_guide
    ):
        """Test non-owner cannot update step."""
        other_user = User(
            id=EntityId(str(uuid4())),
            email=Email("other@example.com"),
            password_hash="hashed",
        )
        mock_step_repository.find_by_id.return_value = sample_step
        mock_guide_repository.find_by_id.return_value = sample_guide
        use_case = UpdateStep(mock_step_repository, mock_guide_repository)
        dto = StepUpdateDTO(title="Updated Title")

        with pytest.raises(AuthorizationException):
            await use_case.execute(sample_step.id.value, dto, other_user)

    async def test_update_step_not_found(
        self, mock_step_repository, mock_guide_repository, sample_user
    ):
        """Test updating non-existent step."""
        mock_step_repository.find_by_id.return_value = None
        use_case = UpdateStep(mock_step_repository, mock_guide_repository)
        dto = StepUpdateDTO(title="Updated Title")

        with pytest.raises(EntityNotFoundException, match="Step not found"):
            await use_case.execute(str(uuid4()), dto, sample_user)
