import pytest
from datetime import datetime
from src.domain.entities import Session
from src.domain.value_objects import EntityId, SessionStatus
from src.domain.exceptions import ValidationException


class TestSession:
    """Test Session entity."""

    def test_create_session(self):
        """Should create session with default status."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")

        session = Session(id=id, guide_id=guide_id)

        assert session.id == id
        assert session.guide_id == guide_id
        assert session.status == SessionStatus.NOT_STARTED
        assert session.started_at is None
        assert session.completed_at is None
        assert session.current_step_id is None
        assert isinstance(session.created_at, datetime)
        assert isinstance(session.updated_at, datetime)
        assert session.is_active() is False

    def test_create_session_with_custom_status(self):
        """Should create session with custom status."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")

        session = Session(id=id, guide_id=guide_id, status=SessionStatus.IN_PROGRESS)

        assert session.status == SessionStatus.IN_PROGRESS

    def test_start_session(self):
        """Should start session from NotStarted."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        session = Session(id=id, guide_id=guide_id)

        session.start()

        assert session.status == SessionStatus.IN_PROGRESS
        assert isinstance(session.started_at, datetime)
        assert session.is_active() is True

    def test_start_already_started_session(self):
        """Should raise ValidationException when starting already started session."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        session = Session(id=id, guide_id=guide_id)
        session.start()

        with pytest.raises(ValidationException) as exc_info:
            session.start()

        assert "already been started" in str(exc_info.value)

    def test_pause_session(self):
        """Should pause session from InProgress."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        session = Session(id=id, guide_id=guide_id)
        session.start()

        session.pause()

        assert session.status == SessionStatus.PAUSED
        assert session.is_active() is True

    def test_pause_not_in_progress_session(self):
        """Should raise ValidationException when pausing not in-progress session."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        session = Session(id=id, guide_id=guide_id)

        with pytest.raises(ValidationException) as exc_info:
            session.pause()

        assert "not in progress" in str(exc_info.value)

    def test_resume_session(self):
        """Should resume session from Paused."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        session = Session(id=id, guide_id=guide_id)
        session.start()
        session.pause()

        session.resume()

        assert session.status == SessionStatus.IN_PROGRESS
        assert session.is_active() is True

    def test_resume_not_paused_session(self):
        """Should raise ValidationException when resuming not paused session."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        session = Session(id=id, guide_id=guide_id)

        with pytest.raises(ValidationException) as exc_info:
            session.resume()

        assert "not paused" in str(exc_info.value)

    def test_complete_session_from_in_progress(self):
        """Should complete session from InProgress."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        session = Session(id=id, guide_id=guide_id)
        session.start()

        session.complete()

        assert session.status == SessionStatus.COMPLETED
        assert isinstance(session.completed_at, datetime)
        assert session.is_active() is False

    def test_complete_session_from_paused(self):
        """Should complete session from Paused."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        session = Session(id=id, guide_id=guide_id)
        session.start()
        session.pause()

        session.complete()

        assert session.status == SessionStatus.COMPLETED
        assert isinstance(session.completed_at, datetime)

    def test_complete_not_started_session(self):
        """Should raise ValidationException when completing not started session."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        session = Session(id=id, guide_id=guide_id)

        with pytest.raises(ValidationException) as exc_info:
            session.complete()

        assert "has not been started" in str(exc_info.value)

    def test_cancel_session_from_in_progress(self):
        """Should cancel session from InProgress."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        session = Session(id=id, guide_id=guide_id)
        session.start()

        session.cancel()

        assert session.status == SessionStatus.CANCELLED
        assert isinstance(session.completed_at, datetime)
        assert session.is_active() is False

    def test_cancel_session_from_paused(self):
        """Should cancel session from Paused."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        session = Session(id=id, guide_id=guide_id)
        session.start()
        session.pause()

        session.cancel()

        assert session.status == SessionStatus.CANCELLED

    def test_cancel_not_started_session(self):
        """Should raise ValidationException when cancelling not started session."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        session = Session(id=id, guide_id=guide_id)

        with pytest.raises(ValidationException) as exc_info:
            session.cancel()

        assert "has not been started" in str(exc_info.value)

    def test_move_to_step_when_in_progress(self):
        """Should move to step when session is in progress."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        step_id = EntityId("550e8400-e29b-41d4-a716-446655440002")
        session = Session(id=id, guide_id=guide_id)
        session.start()

        session.move_to_step(step_id)

        assert session.current_step_id == step_id

    def test_move_to_step_when_paused(self):
        """Should move to step when session is paused."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        step_id = EntityId("550e8400-e29b-41d4-a716-446655440002")
        session = Session(id=id, guide_id=guide_id)
        session.start()
        session.pause()

        session.move_to_step(step_id)

        assert session.current_step_id == step_id

    def test_move_to_step_when_not_active(self):
        """Should raise ValidationException when moving to step in inactive session."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        step_id = EntityId("550e8400-e29b-41d4-a716-446655440002")
        session = Session(id=id, guide_id=guide_id)

        with pytest.raises(ValidationException) as exc_info:
            session.move_to_step(step_id)

        assert "not active" in str(exc_info.value)

    def test_is_active_for_in_progress(self):
        """Should return True for in-progress session."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        session = Session(id=id, guide_id=guide_id)
        session.start()

        assert session.is_active() is True

    def test_is_active_for_paused(self):
        """Should return True for paused session."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        session = Session(id=id, guide_id=guide_id)
        session.start()
        session.pause()

        assert session.is_active() is True

    def test_is_active_for_not_started(self):
        """Should return False for not started session."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        session = Session(id=id, guide_id=guide_id)

        assert session.is_active() is False

    def test_is_active_for_completed(self):
        """Should return False for completed session."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        session = Session(id=id, guide_id=guide_id)
        session.start()
        session.complete()

        assert session.is_active() is False

    def test_is_active_for_cancelled(self):
        """Should return False for cancelled session."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        session = Session(id=id, guide_id=guide_id)
        session.start()
        session.cancel()

        assert session.is_active() is False

    def test_state_transitions_update_timestamp(self):
        """Should update timestamp for all state transitions."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        session = Session(id=id, guide_id=guide_id)

        initial_updated = session.updated_at
        session.start()
        assert session.updated_at > initial_updated

        start_updated = session.updated_at
        session.pause()
        assert session.updated_at > start_updated

        pause_updated = session.updated_at
        session.resume()
        assert session.updated_at > pause_updated

    def test_immutable_properties(self):
        """Should have immutable id, guide_id, created_at."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        guide_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        session = Session(id=id, guide_id=guide_id)

        with pytest.raises(AttributeError):
            session.id = EntityId("550e8400-e29b-41d4-a716-446655440002")

        with pytest.raises(AttributeError):
            session.guide_id = EntityId("550e8400-e29b-41d4-a716-446655440003")

        with pytest.raises(AttributeError):
            session.created_at = datetime.utcnow()
