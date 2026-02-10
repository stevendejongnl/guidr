"""Tests for step timer use cases."""

from datetime import UTC, datetime
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from src.application.use_cases.step_timer import (
    GetStepTimersByGuide,
    PauseStepTimer,
    ResetStepTimer,
    StartStepTimer,
)
from src.domain.entities import StepTimer
from src.domain.exceptions import EntityNotFoundException
from src.domain.repositories import IStepTimerRepository
from src.domain.value_objects import EntityId, StepTimerStatus


class TestStartStepTimer:
    """Test suite for StartStepTimer use case."""

    @pytest.fixture
    def repository(self) -> AsyncMock:
        """Create mock repository."""
        mock = AsyncMock(spec=IStepTimerRepository)
        return mock

    @pytest.fixture
    def use_case(self, repository: AsyncMock) -> StartStepTimer:
        """Create use case with mock repository."""
        return StartStepTimer(repository)

    @pytest.mark.asyncio
    async def test_start_new_timer_creates_and_starts(
        self, use_case: StartStepTimer, repository: AsyncMock
    ) -> None:
        """Test starting a new timer creates and starts it."""
        step_id = str(uuid4())
        guide_id = str(uuid4())
        user_id = str(uuid4())
        duration = 60

        # No existing timer
        repository.find_by_step_and_user.return_value = None

        result = await use_case.execute(
            step_id=step_id,
            guide_id=guide_id,
            duration_seconds=duration,
            user_id=user_id,
        )

        # Verify repository was called correctly
        repository.find_by_step_and_user.assert_called_once()
        repository.save.assert_called_once()

        # Verify response DTO
        assert result.step_id == step_id
        assert result.guide_id == guide_id
        assert result.user_id == user_id
        assert result.status == "running"
        assert result.duration_seconds == duration
        assert result.accumulated_seconds == 0
        assert result.started_at is not None

    @pytest.mark.asyncio
    async def test_resume_paused_timer_starts_it(
        self, use_case: StartStepTimer, repository: AsyncMock
    ) -> None:
        """Test resuming a paused timer starts it."""
        timer_id = EntityId(str(uuid4()))
        step_id = str(uuid4())
        guide_id = str(uuid4())
        user_id = str(uuid4())

        # Existing paused timer
        existing_timer = StepTimer(
            id=timer_id,
            step_id=EntityId(step_id),
            guide_id=EntityId(guide_id),
            user_id=EntityId(user_id),
            status=StepTimerStatus.PAUSED,
            accumulated_seconds=30,
            duration_seconds=60,
        )
        repository.find_by_step_and_user.return_value = existing_timer

        result = await use_case.execute(
            step_id=step_id,
            guide_id=guide_id,
            duration_seconds=60,
            user_id=user_id,
        )

        # Verify timer was started and saved
        repository.save.assert_called_once()
        assert result.status == "running"
        assert result.accumulated_seconds == 30

    @pytest.mark.asyncio
    async def test_start_already_running_timer_is_idempotent(
        self, use_case: StartStepTimer, repository: AsyncMock
    ) -> None:
        """Test starting an already running timer returns as-is."""
        timer_id = EntityId(str(uuid4()))
        step_id = str(uuid4())
        guide_id = str(uuid4())
        user_id = str(uuid4())
        started_at = datetime.now(UTC)

        # Existing running timer
        existing_timer = StepTimer(
            id=timer_id,
            step_id=EntityId(step_id),
            guide_id=EntityId(guide_id),
            user_id=EntityId(user_id),
            status=StepTimerStatus.RUNNING,
            started_at=started_at,
            accumulated_seconds=15,
            duration_seconds=60,
        )
        repository.find_by_step_and_user.return_value = existing_timer

        result = await use_case.execute(
            step_id=step_id,
            guide_id=guide_id,
            duration_seconds=60,
            user_id=user_id,
        )

        # Verify timer was NOT saved again (idempotent)
        repository.save.assert_not_called()
        assert result.status == "running"


class TestPauseStepTimer:
    """Test suite for PauseStepTimer use case."""

    @pytest.fixture
    def repository(self) -> AsyncMock:
        """Create mock repository."""
        mock = AsyncMock(spec=IStepTimerRepository)
        return mock

    @pytest.fixture
    def use_case(self, repository: AsyncMock) -> PauseStepTimer:
        """Create use case with mock repository."""
        return PauseStepTimer(repository)

    @pytest.mark.asyncio
    async def test_pause_running_timer(
        self, use_case: PauseStepTimer, repository: AsyncMock
    ) -> None:
        """Test pausing a running timer."""
        timer_id = str(uuid4())
        step_id = EntityId(str(uuid4()))
        guide_id = EntityId(str(uuid4()))
        user_id = EntityId(str(uuid4()))

        # Create running timer
        timer = StepTimer(
            id=EntityId(timer_id),
            step_id=step_id,
            guide_id=guide_id,
            user_id=user_id,
            status=StepTimerStatus.RUNNING,
            started_at=datetime.now(UTC),
            accumulated_seconds=0,
            duration_seconds=60,
        )
        repository.find_by_id.return_value = timer

        result = await use_case.execute(timer_id=timer_id)

        # Verify timer was paused and saved
        repository.find_by_id.assert_called_once()
        repository.save.assert_called_once()
        assert result.status == "paused"
        assert result.id == timer_id

    @pytest.mark.asyncio
    async def test_pause_non_existent_timer_raises_exception(
        self, use_case: PauseStepTimer, repository: AsyncMock
    ) -> None:
        """Test pausing a non-existent timer raises exception."""
        timer_id = str(uuid4())

        # Timer not found
        repository.find_by_id.return_value = None

        with pytest.raises(
            EntityNotFoundException, match=f"Timer not found: {timer_id}"
        ):
            await use_case.execute(timer_id=timer_id)

        # Verify no save was attempted
        repository.save.assert_not_called()


class TestResetStepTimer:
    """Test suite for ResetStepTimer use case."""

    @pytest.fixture
    def repository(self) -> AsyncMock:
        """Create mock repository."""
        mock = AsyncMock(spec=IStepTimerRepository)
        return mock

    @pytest.fixture
    def use_case(self, repository: AsyncMock) -> ResetStepTimer:
        """Create use case with mock repository."""
        return ResetStepTimer(repository)

    @pytest.mark.asyncio
    async def test_reset_timer(
        self, use_case: ResetStepTimer, repository: AsyncMock
    ) -> None:
        """Test resetting a timer."""
        timer_id = str(uuid4())
        step_id = EntityId(str(uuid4()))
        guide_id = EntityId(str(uuid4()))
        user_id = EntityId(str(uuid4()))

        # Create paused timer with accumulated time
        timer = StepTimer(
            id=EntityId(timer_id),
            step_id=step_id,
            guide_id=guide_id,
            user_id=user_id,
            status=StepTimerStatus.PAUSED,
            accumulated_seconds=45,
            duration_seconds=60,
        )
        repository.find_by_id.return_value = timer

        result = await use_case.execute(timer_id=timer_id)

        # Verify timer was reset and saved
        repository.find_by_id.assert_called_once()
        repository.save.assert_called_once()
        assert result.status == "idle"
        assert result.accumulated_seconds == 0
        assert result.id == timer_id

    @pytest.mark.asyncio
    async def test_reset_non_existent_timer_raises_exception(
        self, use_case: ResetStepTimer, repository: AsyncMock
    ) -> None:
        """Test resetting a non-existent timer raises exception."""
        timer_id = str(uuid4())

        # Timer not found
        repository.find_by_id.return_value = None

        with pytest.raises(
            EntityNotFoundException, match=f"Timer not found: {timer_id}"
        ):
            await use_case.execute(timer_id=timer_id)

        # Verify no save was attempted
        repository.save.assert_not_called()


class TestStartStepTimerTimezone:
    """Test suite for timezone handling in started_at."""

    @pytest.fixture
    def repository(self) -> AsyncMock:
        """Create mock repository."""
        mock = AsyncMock(spec=IStepTimerRepository)
        return mock

    @pytest.fixture
    def use_case(self, repository: AsyncMock) -> StartStepTimer:
        """Create use case with mock repository."""
        return StartStepTimer(repository)

    @pytest.mark.asyncio
    async def test_started_at_includes_utc_offset_for_naive_datetime(
        self, use_case: StartStepTimer, repository: AsyncMock
    ) -> None:
        """Test started_at includes +00:00 even with naive datetime.

        PyMongo returns naive datetimes (no tzinfo). The mapper must
        add UTC offset so JavaScript Date.parse() interprets correctly.
        """
        step_id = str(uuid4())
        guide_id = str(uuid4())
        user_id = str(uuid4())

        # Naive datetime — simulates what PyMongo returns after
        # round-tripping through MongoDB
        naive_started_at = datetime(2026, 2, 10, 14, 30, 45, 123456)

        existing_timer = StepTimer(
            id=EntityId(str(uuid4())),
            step_id=EntityId(step_id),
            guide_id=EntityId(guide_id),
            user_id=EntityId(user_id),
            status=StepTimerStatus.RUNNING,
            started_at=naive_started_at,
            accumulated_seconds=0,
            duration_seconds=60,
        )
        repository.find_by_step_and_user.return_value = existing_timer

        result = await use_case.execute(
            step_id=step_id,
            guide_id=guide_id,
            duration_seconds=60,
            user_id=user_id,
        )

        assert result.started_at is not None
        assert result.started_at.endswith("+00:00")

    @pytest.mark.asyncio
    async def test_started_at_includes_utc_offset_for_aware_datetime(
        self, use_case: StartStepTimer, repository: AsyncMock
    ) -> None:
        """Test started_at preserves offset for aware datetime."""
        step_id = str(uuid4())
        guide_id = str(uuid4())
        user_id = str(uuid4())

        # Aware datetime — what datetime.now(UTC) produces
        aware_started_at = datetime(
            2026, 2, 10, 14, 30, 45, 123456, tzinfo=UTC
        )

        existing_timer = StepTimer(
            id=EntityId(str(uuid4())),
            step_id=EntityId(step_id),
            guide_id=EntityId(guide_id),
            user_id=EntityId(user_id),
            status=StepTimerStatus.RUNNING,
            started_at=aware_started_at,
            accumulated_seconds=0,
            duration_seconds=60,
        )
        repository.find_by_step_and_user.return_value = existing_timer

        result = await use_case.execute(
            step_id=step_id,
            guide_id=guide_id,
            duration_seconds=60,
            user_id=user_id,
        )

        assert result.started_at is not None
        assert result.started_at.endswith("+00:00")


class TestGetStepTimersByGuide:
    """Test suite for GetStepTimersByGuide use case."""

    @pytest.fixture
    def repository(self) -> AsyncMock:
        """Create mock repository."""
        mock = AsyncMock(spec=IStepTimerRepository)
        return mock

    @pytest.fixture
    def use_case(self, repository: AsyncMock) -> GetStepTimersByGuide:
        """Create use case with mock repository."""
        return GetStepTimersByGuide(repository)

    @pytest.mark.asyncio
    async def test_returns_timers_for_guide_and_user(
        self, use_case: GetStepTimersByGuide, repository: AsyncMock
    ) -> None:
        """Test returning all timers for a guide and user."""
        guide_id = str(uuid4())
        user_id = str(uuid4())
        step1_id = EntityId(str(uuid4()))
        step2_id = EntityId(str(uuid4()))

        # Create multiple timers
        timer1 = StepTimer(
            id=EntityId(str(uuid4())),
            step_id=step1_id,
            guide_id=EntityId(guide_id),
            user_id=EntityId(user_id),
            status=StepTimerStatus.IDLE,
            duration_seconds=60,
        )
        timer2 = StepTimer(
            id=EntityId(str(uuid4())),
            step_id=step2_id,
            guide_id=EntityId(guide_id),
            user_id=EntityId(user_id),
            status=StepTimerStatus.RUNNING,
            started_at=datetime.now(UTC),
            duration_seconds=120,
        )
        repository.find_by_guide_and_user.return_value = [timer1, timer2]

        result = await use_case.execute(
            guide_id=guide_id, user_id=user_id
        )

        # Verify repository was called correctly
        repository.find_by_guide_and_user.assert_called_once()

        # Verify response DTOs
        assert len(result) == 2
        assert result[0].guide_id == guide_id
        assert result[0].user_id == user_id
        assert result[0].step_id == str(step1_id)
        assert result[1].step_id == str(step2_id)

    @pytest.mark.asyncio
    async def test_returns_empty_list_when_no_timers(
        self, use_case: GetStepTimersByGuide, repository: AsyncMock
    ) -> None:
        """Test returning empty list when no timers exist."""
        guide_id = str(uuid4())
        user_id = str(uuid4())

        # No timers found
        repository.find_by_guide_and_user.return_value = []

        result = await use_case.execute(
            guide_id=guide_id, user_id=user_id
        )

        # Verify empty list returned
        assert result == []
        repository.find_by_guide_and_user.assert_called_once()
