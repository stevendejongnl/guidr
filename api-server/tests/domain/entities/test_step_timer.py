"""Tests for StepTimer entity."""

from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest

from src.domain.entities import StepTimer
from src.domain.exceptions import ValidationException
from src.domain.value_objects import EntityId, StepTimerStatus


class TestStepTimer:
    """Test suite for StepTimer entity."""

    def test_create_timer_with_default_values(self) -> None:
        """Test creating a timer with default values."""
        timer_id = EntityId(str(uuid4()))
        step_id = EntityId(str(uuid4()))
        guide_id = EntityId(str(uuid4()))
        user_id = EntityId(str(uuid4()))

        timer = StepTimer(
            id=timer_id,
            step_id=step_id,
            guide_id=guide_id,
            user_id=user_id,
        )

        assert timer.id == timer_id
        assert timer.step_id == step_id
        assert timer.guide_id == guide_id
        assert timer.user_id == user_id
        assert timer.status == StepTimerStatus.IDLE
        assert timer.started_at is None
        assert timer.accumulated_seconds == 0
        assert timer.duration_seconds == 0
        assert timer.created_at is not None
        assert timer.updated_at is not None

    def test_create_timer_with_explicit_values(self) -> None:
        """Test creating a timer with explicit values."""
        timer_id = EntityId(str(uuid4()))
        step_id = EntityId(str(uuid4()))
        guide_id = EntityId(str(uuid4()))
        user_id = EntityId(str(uuid4()))
        now = datetime.now(UTC)

        timer = StepTimer(
            id=timer_id,
            step_id=step_id,
            guide_id=guide_id,
            user_id=user_id,
            status=StepTimerStatus.PAUSED,
            started_at=None,
            accumulated_seconds=120,
            duration_seconds=300,
            created_at=now,
            updated_at=now,
        )

        assert timer.status == StepTimerStatus.PAUSED
        assert timer.accumulated_seconds == 120
        assert timer.duration_seconds == 300
        assert timer.created_at == now
        assert timer.updated_at == now

    def test_negative_accumulated_seconds_raises_exception(self) -> None:
        """Test that negative accumulated_seconds raises ValidationException."""
        with pytest.raises(
            ValidationException,
            match="Accumulated seconds must be non-negative"
        ):
            StepTimer(
                id=EntityId(str(uuid4())),
                step_id=EntityId(str(uuid4())),
                guide_id=EntityId(str(uuid4())),
                user_id=EntityId(str(uuid4())),
                accumulated_seconds=-10,
            )

    def test_negative_duration_seconds_raises_exception(self) -> None:
        """Test that negative duration_seconds raises ValidationException."""
        with pytest.raises(
            ValidationException,
            match="Duration seconds must be non-negative"
        ):
            StepTimer(
                id=EntityId(str(uuid4())),
                step_id=EntityId(str(uuid4())),
                guide_id=EntityId(str(uuid4())),
                user_id=EntityId(str(uuid4())),
                duration_seconds=-10,
            )

    def test_start_from_idle_sets_status_and_started_at(self) -> None:
        """Test starting timer from idle state."""
        timer = StepTimer(
            id=EntityId(str(uuid4())),
            step_id=EntityId(str(uuid4())),
            guide_id=EntityId(str(uuid4())),
            user_id=EntityId(str(uuid4())),
        )

        assert timer.status == StepTimerStatus.IDLE
        assert timer.started_at is None

        timer.start()

        assert timer.status == StepTimerStatus.RUNNING
        assert timer.started_at is not None
        assert isinstance(timer.started_at, datetime)

    def test_start_from_paused_sets_status_running(self) -> None:
        """Test starting timer from paused state."""
        timer = StepTimer(
            id=EntityId(str(uuid4())),
            step_id=EntityId(str(uuid4())),
            guide_id=EntityId(str(uuid4())),
            user_id=EntityId(str(uuid4())),
            status=StepTimerStatus.PAUSED,
            accumulated_seconds=60,
        )

        timer.start()

        assert timer.status == StepTimerStatus.RUNNING
        assert timer.started_at is not None

    def test_start_when_already_running_raises_exception(self) -> None:
        """Test starting an already running timer raises exception."""
        timer = StepTimer(
            id=EntityId(str(uuid4())),
            step_id=EntityId(str(uuid4())),
            guide_id=EntityId(str(uuid4())),
            user_id=EntityId(str(uuid4())),
        )

        timer.start()
        assert timer.status == StepTimerStatus.RUNNING

        with pytest.raises(
            ValidationException,
            match="Timer is already running"
        ):
            timer.start()

    def test_pause_from_running_accumulates_time(self) -> None:
        """Test pausing a running timer accumulates elapsed time."""
        timer = StepTimer(
            id=EntityId(str(uuid4())),
            step_id=EntityId(str(uuid4())),
            guide_id=EntityId(str(uuid4())),
            user_id=EntityId(str(uuid4())),
            accumulated_seconds=0,
        )

        timer.start()
        assert timer.status == StepTimerStatus.RUNNING
        original_accumulated = timer.accumulated_seconds

        # Simulate some time passing by setting started_at to past
        timer._started_at = datetime.now(UTC) - timedelta(seconds=5)

        timer.pause()

        assert timer.status == StepTimerStatus.PAUSED
        assert timer.started_at is None
        assert timer.accumulated_seconds >= original_accumulated + 5

    def test_pause_when_not_running_raises_exception(self) -> None:
        """Test pausing a non-running timer raises exception."""
        timer = StepTimer(
            id=EntityId(str(uuid4())),
            step_id=EntityId(str(uuid4())),
            guide_id=EntityId(str(uuid4())),
            user_id=EntityId(str(uuid4())),
        )

        assert timer.status == StepTimerStatus.IDLE

        with pytest.raises(
            ValidationException,
            match="Cannot pause timer that is not running"
        ):
            timer.pause()

    def test_reset_clears_all_timing_data(self) -> None:
        """Test resetting a timer clears all timing data."""
        timer = StepTimer(
            id=EntityId(str(uuid4())),
            step_id=EntityId(str(uuid4())),
            guide_id=EntityId(str(uuid4())),
            user_id=EntityId(str(uuid4())),
            status=StepTimerStatus.PAUSED,
            accumulated_seconds=120,
        )

        timer.reset()

        assert timer.status == StepTimerStatus.IDLE
        assert timer.started_at is None
        assert timer.accumulated_seconds == 0

    def test_is_complete_false_for_stopwatch_mode(self) -> None:
        """Test is_complete returns False for stopwatch mode."""
        timer = StepTimer(
            id=EntityId(str(uuid4())),
            step_id=EntityId(str(uuid4())),
            guide_id=EntityId(str(uuid4())),
            user_id=EntityId(str(uuid4())),
            duration_seconds=0,  # Stopwatch mode
            accumulated_seconds=300,
        )

        assert timer.is_complete is False

    def test_is_complete_true_when_time_reached(self) -> None:
        """Test is_complete returns True when accumulated >= duration."""
        timer = StepTimer(
            id=EntityId(str(uuid4())),
            step_id=EntityId(str(uuid4())),
            guide_id=EntityId(str(uuid4())),
            user_id=EntityId(str(uuid4())),
            duration_seconds=60,
            accumulated_seconds=60,
        )

        assert timer.is_complete is True

    def test_is_complete_true_when_time_exceeded(self) -> None:
        """Test is_complete returns True when accumulated > duration."""
        timer = StepTimer(
            id=EntityId(str(uuid4())),
            step_id=EntityId(str(uuid4())),
            guide_id=EntityId(str(uuid4())),
            user_id=EntityId(str(uuid4())),
            duration_seconds=60,
            accumulated_seconds=90,
        )

        assert timer.is_complete is True

    def test_is_complete_false_when_time_not_reached(self) -> None:
        """Test is_complete returns False when accumulated < duration."""
        timer = StepTimer(
            id=EntityId(str(uuid4())),
            step_id=EntityId(str(uuid4())),
            guide_id=EntityId(str(uuid4())),
            user_id=EntityId(str(uuid4())),
            duration_seconds=60,
            accumulated_seconds=30,
        )

        assert timer.is_complete is False
