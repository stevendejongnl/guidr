import pytest

from src.domain.value_objects import SessionStatus


class TestSessionStatus:
    """Test SessionStatus enum."""

    def test_all_statuses_exist(self):
        """Should have all required status values."""
        assert SessionStatus.NOT_STARTED == "NotStarted"
        assert SessionStatus.IN_PROGRESS == "InProgress"
        assert SessionStatus.PAUSED == "Paused"
        assert SessionStatus.COMPLETED == "Completed"
        assert SessionStatus.CANCELLED == "Cancelled"

    def test_str_representation(self):
        """Should return value as string."""
        assert str(SessionStatus.NOT_STARTED) == "NotStarted"
        assert str(SessionStatus.IN_PROGRESS) == "InProgress"

    def test_value_property(self):
        """Should have correct value property."""
        assert SessionStatus.NOT_STARTED.value == "NotStarted"
        assert SessionStatus.COMPLETED.value == "Completed"

    def test_equality(self):
        """Should be equal to same status."""
        status1 = SessionStatus.IN_PROGRESS
        status2 = SessionStatus.IN_PROGRESS

        assert status1 == status2

    def test_inequality(self):
        """Should not be equal to different status."""
        assert SessionStatus.NOT_STARTED != SessionStatus.IN_PROGRESS

    def test_create_from_string(self):
        """Should create from string value."""
        status = SessionStatus("InProgress")

        assert status == SessionStatus.IN_PROGRESS

    def test_invalid_string_raises_error(self):
        """Should raise ValueError for invalid status string."""
        with pytest.raises(ValueError):
            SessionStatus("InvalidStatus")

    def test_all_statuses_are_unique(self):
        """Should have all unique status values."""
        statuses = list(SessionStatus)

        assert len(statuses) == 5
        assert len(set(statuses)) == 5
