"""Tests for StepTimerStatus value object."""

from src.domain.value_objects import StepTimerStatus


class TestStepTimerStatus:
    """Test suite for StepTimerStatus value object."""

    def test_has_idle_status(self) -> None:
        """Test IDLE status exists and has correct value."""
        assert StepTimerStatus.IDLE.value == "idle"

    def test_has_running_status(self) -> None:
        """Test RUNNING status exists and has correct value."""
        assert StepTimerStatus.RUNNING.value == "running"

    def test_has_paused_status(self) -> None:
        """Test PAUSED status exists and has correct value."""
        assert StepTimerStatus.PAUSED.value == "paused"

    def test_str_returns_value(self) -> None:
        """Test __str__ returns the enum value."""
        assert str(StepTimerStatus.IDLE) == "idle"
        assert str(StepTimerStatus.RUNNING) == "running"
        assert str(StepTimerStatus.PAUSED) == "paused"

    def test_is_str_subclass(self) -> None:
        """Test StepTimerStatus is a str subclass."""
        assert isinstance(StepTimerStatus.IDLE, str)
        assert isinstance(StepTimerStatus.RUNNING, str)
        assert isinstance(StepTimerStatus.PAUSED, str)
