"""Tests for CreateGuideWithSteps use case."""

from uuid import uuid4

import pytest

from src.application.dtos.guide_with_steps_dtos import (
    CreateGuideWithStepsDTO,
    StepInput,
)
from src.application.use_cases.guide import CreateGuideWithSteps
from src.domain.entities import Guide, Step, User
from src.domain.repositories import IGuideRepository, IStepRepository
from src.domain.value_objects import Email, EntityId, GuideType


class MockGuideRepository(IGuideRepository):
    """Mock guide repository for testing."""

    def __init__(self):
        self.saved_guides: list[Guide] = []

    async def find_by_id(self, id: EntityId) -> Guide | None:
        return next(
            (g for g in self.saved_guides if g.id == id), None
        )

    async def find_all(self) -> list[Guide]:
        return self.saved_guides

    async def find_by_type(
        self, guide_type: GuideType
    ) -> list[Guide]:
        return []

    async def find_by_user_id(
        self, user_id: EntityId
    ) -> list[Guide]:
        return []

    async def find_public_guides(self) -> list[Guide]:
        return []

    async def find_highlighted_guides(self) -> list[Guide]:
        return []

    async def find_accessible_by_user(
        self, user_id: EntityId | None
    ) -> list[Guide]:
        return []

    async def save(self, entity: Guide) -> None:
        self.saved_guides.append(entity)

    async def delete(self, id: EntityId) -> None:
        pass


class MockStepRepository(IStepRepository):
    """Mock step repository for testing."""

    def __init__(self):
        self.saved_steps: list[Step] = []

    async def find_by_id(self, id: EntityId) -> Step | None:
        return next(
            (s for s in self.saved_steps if s.id == id), None
        )

    async def find_all(self) -> list[Step]:
        return self.saved_steps

    async def find_by_guide_id(
        self, guide_id: EntityId
    ) -> list[Step]:
        return [
            s
            for s in self.saved_steps
            if s.guide_id == guide_id
        ]

    async def save(self, entity: Step) -> None:
        self.saved_steps.append(entity)

    async def delete(self, id: EntityId) -> None:
        pass


class TestCreateGuideWithSteps:
    """Tests for CreateGuideWithSteps use case."""

    @pytest.fixture
    def guide_repo(self) -> MockGuideRepository:
        return MockGuideRepository()

    @pytest.fixture
    def step_repo(self) -> MockStepRepository:
        return MockStepRepository()

    @pytest.fixture
    def user(self) -> User:
        return User(
            id=EntityId(str(uuid4())),
            email=Email("user@example.com"),
            password_hash="hashed",
        )

    @pytest.mark.asyncio
    async def test_creates_guide_and_steps(
        self,
        guide_repo: MockGuideRepository,
        step_repo: MockStepRepository,
        user: User,
    ):
        use_case = CreateGuideWithSteps(
            guide_repository=guide_repo,
            step_repository=step_repo,
        )

        dto = CreateGuideWithStepsDTO(
            guide_type="cooking",
            title="Bread Guide",
            description="Baking bread",
            is_public=False,
            steps=[
                StepInput(
                    order=1,
                    title="Mix",
                    description="Mix flour",
                    duration=600,
                ),
                StepInput(
                    order=2,
                    title="Bake",
                    duration=1800,
                ),
            ],
        )

        guide_dto, step_dtos = await use_case.execute(
            dto, user
        )

        assert guide_dto.title == "Bread Guide"
        assert guide_dto.guide_type == "cooking"
        assert len(step_dtos) == 2
        assert step_dtos[0].title == "Mix"
        assert step_dtos[0].duration == 600
        assert step_dtos[1].title == "Bake"
        assert step_dtos[1].order == 2

        assert len(guide_repo.saved_guides) == 1
        assert len(step_repo.saved_steps) == 2

    @pytest.mark.asyncio
    async def test_sets_owner_from_user(
        self,
        guide_repo: MockGuideRepository,
        step_repo: MockStepRepository,
        user: User,
    ):
        use_case = CreateGuideWithSteps(
            guide_repository=guide_repo,
            step_repository=step_repo,
        )

        dto = CreateGuideWithStepsDTO(
            guide_type="general",
            title="My Guide",
        )

        guide_dto, _ = await use_case.execute(dto, user)

        assert guide_dto.created_by_user_id == user.id.value

    @pytest.mark.asyncio
    async def test_rejects_invalid_guide_type(
        self,
        guide_repo: MockGuideRepository,
        step_repo: MockStepRepository,
    ):
        use_case = CreateGuideWithSteps(
            guide_repository=guide_repo,
            step_repository=step_repo,
        )

        dto = CreateGuideWithStepsDTO(
            guide_type="invalid",
            title="Test",
        )

        with pytest.raises(ValueError):
            await use_case.execute(dto)

    @pytest.mark.asyncio
    async def test_validates_metadata(
        self,
        guide_repo: MockGuideRepository,
        step_repo: MockStepRepository,
    ):
        use_case = CreateGuideWithSteps(
            guide_repository=guide_repo,
            step_repository=step_repo,
        )

        dto = CreateGuideWithStepsDTO(
            guide_type="cooking",
            title="Test",
            metadata={"invalid_key": "value"},
        )

        with pytest.raises(ValueError):
            await use_case.execute(dto)

    @pytest.mark.asyncio
    async def test_creates_guide_without_steps(
        self,
        guide_repo: MockGuideRepository,
        step_repo: MockStepRepository,
    ):
        use_case = CreateGuideWithSteps(
            guide_repository=guide_repo,
            step_repository=step_repo,
        )

        dto = CreateGuideWithStepsDTO(
            guide_type="general",
            title="Empty Guide",
        )

        guide_dto, step_dtos = await use_case.execute(dto)

        assert guide_dto.title == "Empty Guide"
        assert len(step_dtos) == 0
