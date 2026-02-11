"""Tests for StepTimerMapper."""

from datetime import UTC, datetime
from uuid import uuid4

from src.domain.value_objects import StepTimerStatus

from .step_timer_mapper import StepTimerMapper, _ensure_utc

TIMER_ID = str(uuid4())
STEP_ID = str(uuid4())
GUIDE_ID = str(uuid4())
USER_ID = str(uuid4())


class TestEnsureUtc:
    """Tests for _ensure_utc helper."""

    def test_returns_none_for_none(self) -> None:
        assert _ensure_utc(None) is None

    def test_attaches_utc_to_naive_datetime(self) -> None:
        naive = datetime(2026, 2, 11, 16, 0, 0)
        assert naive.tzinfo is None

        result = _ensure_utc(naive)

        assert result is not None
        assert result.tzinfo is UTC
        assert result.year == 2026
        assert result.hour == 16

    def test_preserves_aware_datetime(self) -> None:
        aware = datetime(2026, 2, 11, 16, 0, 0, tzinfo=UTC)

        result = _ensure_utc(aware)

        assert result is aware


class TestStepTimerMapper:
    """Tests for StepTimerMapper."""

    def test_to_entity_with_naive_started_at(self) -> None:
        """Naive startedAt from MongoDB gets UTC attached.

        Fixes GUIDR-API-5: pause() crashed with
        'can't subtract offset-naive and offset-aware datetimes'.
        """
        naive_dt = datetime(2026, 2, 11, 16, 0, 0)
        document = {
            "_id": TIMER_ID,
            "stepId": STEP_ID,
            "guideId": GUIDE_ID,
            "userId": USER_ID,
            "status": StepTimerStatus.RUNNING.value,
            "startedAt": naive_dt,
            "accumulatedSeconds": 0,
            "durationSeconds": 300,
            "createdAt": naive_dt,
            "updatedAt": naive_dt,
        }

        timer = StepTimerMapper.to_entity(document)

        assert timer.started_at is not None
        assert timer.started_at.tzinfo is UTC

    def test_to_entity_with_none_started_at(self) -> None:
        """None startedAt stays None (paused/idle timers)."""
        now = datetime(2026, 2, 11, 16, 0, 0, tzinfo=UTC)
        document = {
            "_id": TIMER_ID,
            "stepId": STEP_ID,
            "guideId": GUIDE_ID,
            "userId": USER_ID,
            "status": StepTimerStatus.IDLE.value,
            "createdAt": now,
            "updatedAt": now,
        }

        timer = StepTimerMapper.to_entity(document)

        assert timer.started_at is None

    def test_to_entity_with_aware_started_at(self) -> None:
        """Already-aware startedAt is preserved as-is."""
        aware_dt = datetime(2026, 2, 11, 16, 0, 0, tzinfo=UTC)
        document = {
            "_id": TIMER_ID,
            "stepId": STEP_ID,
            "guideId": GUIDE_ID,
            "userId": USER_ID,
            "status": StepTimerStatus.RUNNING.value,
            "startedAt": aware_dt,
            "accumulatedSeconds": 10,
            "durationSeconds": 300,
            "createdAt": aware_dt,
            "updatedAt": aware_dt,
        }

        timer = StepTimerMapper.to_entity(document)

        assert timer.started_at is aware_dt
