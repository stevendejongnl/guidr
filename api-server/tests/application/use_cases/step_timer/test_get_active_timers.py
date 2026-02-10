"""Tests for GetActiveTimers use case."""

from datetime import UTC, datetime
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from src.application.use_cases.step_timer import GetActiveTimers
from src.domain.entities import Guide, Step, StepTimer
from src.domain.repositories import (
    IGuideRepository,
    IStepRepository,
    IStepTimerRepository,
)
from src.domain.value_objects import (
    EntityId,
    GuideTitle,
    GuideType,
    StepTimerStatus,
)


class TestGetActiveTimers:
    """Test suite for GetActiveTimers use case."""

    @pytest.fixture
    def timer_repository(self) -> AsyncMock:
        mock = AsyncMock(spec=IStepTimerRepository)
        return mock

    @pytest.fixture
    def guide_repository(self) -> AsyncMock:
        mock = AsyncMock(spec=IGuideRepository)
        return mock

    @pytest.fixture
    def step_repository(self) -> AsyncMock:
        mock = AsyncMock(spec=IStepRepository)
        return mock

    @pytest.fixture
    def use_case(
        self,
        timer_repository: AsyncMock,
        guide_repository: AsyncMock,
        step_repository: AsyncMock,
    ) -> GetActiveTimers:
        return GetActiveTimers(
            timer_repository, guide_repository, step_repository
        )

    @pytest.mark.asyncio
    async def test_returns_enriched_dtos(
        self,
        use_case: GetActiveTimers,
        timer_repository: AsyncMock,
        guide_repository: AsyncMock,
        step_repository: AsyncMock,
    ) -> None:
        """Test returns DTOs with guide and step titles."""
        user_id = str(uuid4())
        guide_id = EntityId(str(uuid4()))
        step_id = EntityId(str(uuid4()))

        timer = StepTimer(
            id=EntityId(str(uuid4())),
            step_id=step_id,
            guide_id=guide_id,
            user_id=EntityId(user_id),
            status=StepTimerStatus.RUNNING,
            started_at=datetime.now(UTC),
            duration_seconds=60,
        )
        timer_repository.find_active_by_user.return_value = [timer]

        guide = Guide(
            id=guide_id,
            title=GuideTitle("My Cooking Guide"),
            description="A guide",
            guide_type=GuideType.COOKING,
            created_by_user_id=EntityId(str(uuid4())),
        )
        guide_repository.find_by_id.return_value = guide

        step = Step(
            id=step_id,
            guide_id=guide_id,
            title="Preheat Oven",
            order=1,
        )
        step_repository.find_by_id.return_value = step

        result = await use_case.execute(user_id=user_id)

        assert len(result) == 1
        assert result[0].guide_title == "My Cooking Guide"
        assert result[0].step_title == "Preheat Oven"
        assert result[0].status == "running"
        assert result[0].guide_id == guide_id.value
        assert result[0].step_id == step_id.value

    @pytest.mark.asyncio
    async def test_returns_empty_list_when_no_active_timers(
        self,
        use_case: GetActiveTimers,
        timer_repository: AsyncMock,
    ) -> None:
        """Test returns empty list when user has no active timers."""
        user_id = str(uuid4())
        timer_repository.find_active_by_user.return_value = []

        result = await use_case.execute(user_id=user_id)

        assert result == []
        timer_repository.find_active_by_user.assert_called_once()

    @pytest.mark.asyncio
    async def test_handles_missing_guide_and_step(
        self,
        use_case: GetActiveTimers,
        timer_repository: AsyncMock,
        guide_repository: AsyncMock,
        step_repository: AsyncMock,
    ) -> None:
        """Test falls back to 'Unknown' for deleted guide/step."""
        user_id = str(uuid4())

        timer = StepTimer(
            id=EntityId(str(uuid4())),
            step_id=EntityId(str(uuid4())),
            guide_id=EntityId(str(uuid4())),
            user_id=EntityId(user_id),
            status=StepTimerStatus.PAUSED,
            accumulated_seconds=30,
            duration_seconds=60,
        )
        timer_repository.find_active_by_user.return_value = [timer]
        guide_repository.find_by_id.return_value = None
        step_repository.find_by_id.return_value = None

        result = await use_case.execute(user_id=user_id)

        assert len(result) == 1
        assert result[0].guide_title == "Unknown"
        assert result[0].step_title == "Unknown"
        assert result[0].status == "paused"
