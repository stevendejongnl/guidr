"""Tests for event publishing in step timer use cases."""

from datetime import UTC, datetime
from unittest.mock import AsyncMock

import pytest

from src.application.use_cases.step_timer import (
    PauseStepTimer,
    ResetStepTimer,
    StartStepTimer,
)
from src.domain.entities import StepTimer
from src.domain.events.timer_events import (
    StepTimerPaused,
    StepTimerReset,
    StepTimerStarted,
)
from src.domain.value_objects import EntityId, StepTimerStatus
from src.infrastructure.event_bus.in_memory_event_bus import (
    InMemoryEventBus,
)

TIMER_ID = "00000000-0000-4000-8000-000000000001"
STEP_ID = "00000000-0000-4000-8000-000000000002"
GUIDE_ID = "00000000-0000-4000-8000-000000000003"
USER_ID = "00000000-0000-4000-8000-000000000004"


def _make_timer(
    *,
    status: StepTimerStatus = StepTimerStatus.IDLE,
    started_at: datetime | None = None,
    accumulated_seconds: int = 0,
) -> StepTimer:
    return StepTimer(
        id=EntityId(TIMER_ID),
        step_id=EntityId(STEP_ID),
        guide_id=EntityId(GUIDE_ID),
        user_id=EntityId(USER_ID),
        status=status,
        started_at=started_at,
        accumulated_seconds=accumulated_seconds,
        duration_seconds=300,
    )


class TestStartStepTimerEventPublishing:
    """Test StartStepTimer publishes events."""

    @pytest.fixture
    def repo(self):
        repo = AsyncMock()
        repo.save = AsyncMock()
        return repo

    @pytest.fixture
    def event_bus(self):
        return InMemoryEventBus()

    @pytest.mark.asyncio
    async def test_publishes_started_event_for_new_timer(
        self, repo, event_bus
    ):
        repo.find_by_step_and_user = AsyncMock(
            return_value=None
        )
        received: list[StepTimerStarted] = []

        async def handler(event):
            received.append(event)

        event_bus.subscribe(StepTimerStarted, handler)

        uc = StartStepTimer(repo, event_bus=event_bus)
        await uc.execute(STEP_ID, GUIDE_ID, 300, USER_ID)

        assert len(received) == 1
        assert received[0].step_id == STEP_ID
        assert received[0].guide_id == GUIDE_ID
        assert received[0].user_id == USER_ID
        assert received[0].duration_seconds == 300

    @pytest.mark.asyncio
    async def test_publishes_started_event_for_resumed(
        self, repo, event_bus
    ):
        timer = _make_timer(status=StepTimerStatus.PAUSED)
        repo.find_by_step_and_user = AsyncMock(
            return_value=timer
        )
        received: list[StepTimerStarted] = []

        async def handler(event):
            received.append(event)

        event_bus.subscribe(StepTimerStarted, handler)

        uc = StartStepTimer(repo, event_bus=event_bus)
        await uc.execute(STEP_ID, GUIDE_ID, 300, USER_ID)

        assert len(received) == 1

    @pytest.mark.asyncio
    async def test_no_event_when_already_running(
        self, repo, event_bus
    ):
        timer = _make_timer(
            status=StepTimerStatus.RUNNING,
            started_at=datetime.now(UTC),
        )
        repo.find_by_step_and_user = AsyncMock(
            return_value=timer
        )
        received: list[StepTimerStarted] = []

        async def handler(event):
            received.append(event)

        event_bus.subscribe(StepTimerStarted, handler)

        uc = StartStepTimer(repo, event_bus=event_bus)
        await uc.execute(STEP_ID, GUIDE_ID, 300, USER_ID)

        assert len(received) == 0

    @pytest.mark.asyncio
    async def test_no_event_bus_is_fine(self, repo):
        """Use case works without event bus (backward compat)."""
        repo.find_by_step_and_user = AsyncMock(
            return_value=None
        )
        uc = StartStepTimer(repo)
        result = await uc.execute(
            STEP_ID, GUIDE_ID, 300, USER_ID
        )
        assert result.step_id == STEP_ID


class TestPauseStepTimerEventPublishing:
    """Test PauseStepTimer publishes events."""

    @pytest.fixture
    def repo(self):
        repo = AsyncMock()
        repo.save = AsyncMock()
        return repo

    @pytest.fixture
    def event_bus(self):
        return InMemoryEventBus()

    @pytest.mark.asyncio
    async def test_publishes_paused_event(
        self, repo, event_bus
    ):
        timer = _make_timer(
            status=StepTimerStatus.RUNNING,
            started_at=datetime.now(UTC),
        )
        repo.find_by_id = AsyncMock(return_value=timer)
        received: list[StepTimerPaused] = []

        async def handler(event):
            received.append(event)

        event_bus.subscribe(StepTimerPaused, handler)

        uc = PauseStepTimer(repo, event_bus=event_bus)
        await uc.execute(TIMER_ID)

        assert len(received) == 1
        assert received[0].timer_id == TIMER_ID
        assert received[0].user_id == USER_ID


class TestResetStepTimerEventPublishing:
    """Test ResetStepTimer publishes events."""

    @pytest.fixture
    def repo(self):
        repo = AsyncMock()
        repo.save = AsyncMock()
        return repo

    @pytest.fixture
    def event_bus(self):
        return InMemoryEventBus()

    @pytest.mark.asyncio
    async def test_publishes_reset_event(
        self, repo, event_bus
    ):
        timer = _make_timer(
            status=StepTimerStatus.RUNNING,
            started_at=datetime.now(UTC),
        )
        repo.find_by_id = AsyncMock(return_value=timer)
        received: list[StepTimerReset] = []

        async def handler(event):
            received.append(event)

        event_bus.subscribe(StepTimerReset, handler)

        uc = ResetStepTimer(repo, event_bus=event_bus)
        await uc.execute(TIMER_ID)

        assert len(received) == 1
        assert received[0].timer_id == TIMER_ID
        assert received[0].step_id == STEP_ID
        assert received[0].user_id == USER_ID
