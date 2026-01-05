"""Tests for Session use cases."""

from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from src.application.dtos import SessionCreateDTO
from src.application.use_cases.session import (
    CancelSession,
    CompleteSession,
    CreateSession,
    DeleteSession,
    GetSessionsByGuide,
    GetSessionsByStatus,
    MoveSessionToStep,
    PauseSession,
    ResumeSession,
    StartSession,
)
from src.domain.entities import Guide, Session, Step
from src.domain.exceptions import EntityNotFoundException, ValidationException
from src.domain.value_objects import (
    EntityId,
    GuideTitle,
    SessionStatus,
    StepDuration,
)


@pytest.fixture
def mock_session_repository():
    """Create mock session repository."""
    return AsyncMock()


@pytest.fixture
def mock_guide_repository():
    """Create mock guide repository."""
    return AsyncMock()


@pytest.fixture
def mock_step_repository():
    """Create mock step repository."""
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
        duration=StepDuration(60),
    )


@pytest.fixture
def sample_session(sample_guide):
    """Create a sample session."""
    return Session(
        id=EntityId(str(uuid4())),
        guide_id=sample_guide.id,
    )


class TestCreateSession:
    """Tests for CreateSession use case."""

    async def test_create_session_success(
        self, mock_session_repository, mock_guide_repository, sample_guide
    ):
        """Test successful session creation."""
        mock_guide_repository.find_by_id.return_value = sample_guide
        use_case = CreateSession(mock_session_repository, mock_guide_repository)
        dto = SessionCreateDTO(guide_id=sample_guide.id.value)

        result = await use_case.execute(dto)

        assert result.guide_id == sample_guide.id.value
        assert result.status == SessionStatus.NOT_STARTED.value
        assert result.id is not None
        mock_session_repository.save.assert_called_once()

    async def test_create_session_invalid_guide(
        self, mock_session_repository, mock_guide_repository
    ):
        """Test creating session with non-existent guide."""
        mock_guide_repository.find_by_id.return_value = None
        use_case = CreateSession(mock_session_repository, mock_guide_repository)
        dto = SessionCreateDTO(guide_id=str(uuid4()))

        with pytest.raises(ValidationException, match="Guide not found"):
            await use_case.execute(dto)


class TestGetSessionsByGuide:
    """Tests for GetSessionsByGuide use case."""

    async def test_get_sessions_by_guide(
        self, mock_session_repository, sample_session, sample_guide
    ):
        """Test getting sessions by guide."""
        mock_session_repository.find_by_guide_id.return_value = [sample_session]
        use_case = GetSessionsByGuide(mock_session_repository)

        result = await use_case.execute(sample_guide.id.value)

        assert len(result) == 1
        assert result[0].guide_id == sample_guide.id.value


class TestGetSessionsByStatus:
    """Tests for GetSessionsByStatus use case."""

    async def test_get_sessions_by_status(
        self, mock_session_repository, sample_session
    ):
        """Test getting sessions by status."""
        mock_session_repository.find_by_status.return_value = [sample_session]
        use_case = GetSessionsByStatus(mock_session_repository)

        result = await use_case.execute(SessionStatus.NOT_STARTED.value)

        assert len(result) == 1
        assert result[0].status == SessionStatus.NOT_STARTED.value


class TestStartSession:
    """Tests for StartSession use case."""

    async def test_start_session_success(
        self, mock_session_repository, sample_session
    ):
        """Test starting a session."""
        mock_session_repository.find_by_id.return_value = sample_session
        use_case = StartSession(mock_session_repository)

        result = await use_case.execute(sample_session.id.value)

        assert result.status == SessionStatus.IN_PROGRESS.value
        assert result.started_at is not None
        mock_session_repository.save.assert_called_once()

    async def test_start_session_not_found(self, mock_session_repository):
        """Test starting non-existent session."""
        mock_session_repository.find_by_id.return_value = None
        use_case = StartSession(mock_session_repository)

        with pytest.raises(EntityNotFoundException, match="Session not found"):
            await use_case.execute(str(uuid4()))


class TestPauseSession:
    """Tests for PauseSession use case."""

    async def test_pause_session_success(
        self, mock_session_repository, sample_session
    ):
        """Test pausing an active session."""
        sample_session.start()
        mock_session_repository.find_by_id.return_value = sample_session
        use_case = PauseSession(mock_session_repository)

        result = await use_case.execute(sample_session.id.value)

        assert result.status == SessionStatus.PAUSED.value
        mock_session_repository.save.assert_called_once()


class TestResumeSession:
    """Tests for ResumeSession use case."""

    async def test_resume_session_success(
        self, mock_session_repository, sample_session
    ):
        """Test resuming a paused session."""
        sample_session.start()
        sample_session.pause()
        mock_session_repository.find_by_id.return_value = sample_session
        use_case = ResumeSession(mock_session_repository)

        result = await use_case.execute(sample_session.id.value)

        assert result.status == SessionStatus.IN_PROGRESS.value
        mock_session_repository.save.assert_called_once()


class TestCompleteSession:
    """Tests for CompleteSession use case."""

    async def test_complete_session_success(
        self, mock_session_repository, sample_session
    ):
        """Test completing an active session."""
        sample_session.start()
        mock_session_repository.find_by_id.return_value = sample_session
        use_case = CompleteSession(mock_session_repository)

        result = await use_case.execute(sample_session.id.value)

        assert result.status == SessionStatus.COMPLETED.value
        assert result.completed_at is not None
        mock_session_repository.save.assert_called_once()


class TestCancelSession:
    """Tests for CancelSession use case."""

    async def test_cancel_session_success(
        self, mock_session_repository, sample_session
    ):
        """Test cancelling an active session."""
        sample_session.start()
        mock_session_repository.find_by_id.return_value = sample_session
        use_case = CancelSession(mock_session_repository)

        result = await use_case.execute(sample_session.id.value)

        assert result.status == SessionStatus.CANCELLED.value
        mock_session_repository.save.assert_called_once()


class TestMoveSessionToStep:
    """Tests for MoveSessionToStep use case."""

    async def test_move_to_step_success(
        self,
        mock_session_repository,
        mock_step_repository,
        sample_session,
        sample_step,
    ):
        """Test moving session to a step."""
        sample_session.start()
        mock_session_repository.find_by_id.return_value = sample_session
        mock_step_repository.find_by_id.return_value = sample_step
        use_case = MoveSessionToStep(mock_session_repository, mock_step_repository)

        result = await use_case.execute(
            sample_session.id.value, sample_step.id.value
        )

        assert result.current_step_id == sample_step.id.value
        mock_session_repository.save.assert_called_once()

    async def test_move_to_step_invalid_step(
        self, mock_session_repository, mock_step_repository, sample_session
    ):
        """Test moving to non-existent step."""
        sample_session.start()
        mock_session_repository.find_by_id.return_value = sample_session
        mock_step_repository.find_by_id.return_value = None
        use_case = MoveSessionToStep(mock_session_repository, mock_step_repository)

        with pytest.raises(EntityNotFoundException, match="Step not found"):
            await use_case.execute(sample_session.id.value, str(uuid4()))

    async def test_move_to_step_wrong_guide(
        self,
        mock_session_repository,
        mock_step_repository,
        sample_session,
    ):
        """Test moving to step from different guide."""
        sample_session.start()
        wrong_step = Step(
            id=EntityId(str(uuid4())),
            guide_id=EntityId(str(uuid4())),  # Different guide
            order=1,
            title="Wrong Step",
            duration=StepDuration(60),
        )
        mock_session_repository.find_by_id.return_value = sample_session
        mock_step_repository.find_by_id.return_value = wrong_step
        use_case = MoveSessionToStep(mock_session_repository, mock_step_repository)

        with pytest.raises(ValidationException, match="does not belong to guide"):
            await use_case.execute(sample_session.id.value, wrong_step.id.value)


class TestDeleteSession:
    """Tests for DeleteSession use case."""

    async def test_delete_session(self, mock_session_repository):
        """Test deleting a session."""
        use_case = DeleteSession(mock_session_repository)
        session_id = str(uuid4())

        await use_case.execute(session_id)

        mock_session_repository.delete.assert_called_once()
