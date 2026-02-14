"""Tests for CopyGuide use case."""

from uuid import uuid4

import pytest

from src.application.dtos import CopyGuideDTO
from src.application.use_cases.guide import CopyGuide
from src.domain.entities import Guide, Step, User
from src.domain.exceptions import EntityNotFoundException
from src.domain.repositories import IGuideRepository, IStepRepository
from src.domain.value_objects import (
    Email,
    EntityId,
    GuideTitle,
    GuideType,
    Language,
    StepDuration,
)


class MockGuideRepository(IGuideRepository):
    """Mock guide repository for testing."""

    def __init__(self):
        self.saved_guides: list[Guide] = []
        self._guides: list[Guide] = []

    def add_existing(self, guide: Guide) -> None:
        self._guides.append(guide)

    async def find_by_id(self, id: EntityId) -> Guide | None:
        existing = next(
            (g for g in self._guides if g.id == id), None
        )
        if existing:
            return existing
        return next(
            (g for g in self.saved_guides if g.id == id), None
        )

    async def find_all(self) -> list[Guide]:
        return self._guides + self.saved_guides

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
        self._steps: list[Step] = []

    def add_existing(self, step: Step) -> None:
        self._steps.append(step)

    async def find_by_id(self, id: EntityId) -> Step | None:
        return next(
            (s for s in self._steps if s.id == id), None
        )

    async def find_all(self) -> list[Step]:
        return self._steps

    async def find_by_guide_id(
        self, guide_id: EntityId
    ) -> list[Step]:
        return [
            s for s in self._steps if s.guide_id == guide_id
        ]

    async def save(self, entity: Step) -> None:
        self.saved_steps.append(entity)

    async def delete(self, id: EntityId) -> None:
        pass


class TestCopyGuide:
    """Tests for CopyGuide use case."""

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

    @pytest.fixture
    def source_guide(self) -> Guide:
        guide_id = EntityId(str(uuid4()))
        return Guide(
            id=guide_id,
            guide_type=GuideType("cooking"),
            title=GuideTitle("Bread Baking"),
            description="How to bake bread",
            language=Language("en"),
        )

    @pytest.fixture
    def source_steps(self, source_guide: Guide) -> list[Step]:
        return [
            Step(
                id=EntityId(str(uuid4())),
                guide_id=source_guide.id,
                order=1,
                title="Mix ingredients",
                description="Combine flour and water",
                duration=StepDuration(600),
            ),
            Step(
                id=EntityId(str(uuid4())),
                guide_id=source_guide.id,
                order=2,
                title="Knead dough",
                duration=StepDuration(300),
            ),
        ]

    @pytest.mark.asyncio
    async def test_copies_guide_with_new_language(
        self,
        guide_repo: MockGuideRepository,
        step_repo: MockStepRepository,
        user: User,
        source_guide: Guide,
        source_steps: list[Step],
    ):
        guide_repo.add_existing(source_guide)
        for step in source_steps:
            step_repo.add_existing(step)

        use_case = CopyGuide(guide_repo, step_repo)
        dto = CopyGuideDTO(
            source_guide_id=source_guide.id.value,
            target_language="nl",
        )

        guide_dto, step_dtos = await use_case.execute(
            dto, user
        )

        assert guide_dto.language == "nl"
        assert guide_dto.title == "Bread Baking"
        assert guide_dto.guide_type == "cooking"

    @pytest.mark.asyncio
    async def test_copies_all_steps(
        self,
        guide_repo: MockGuideRepository,
        step_repo: MockStepRepository,
        user: User,
        source_guide: Guide,
        source_steps: list[Step],
    ):
        guide_repo.add_existing(source_guide)
        for step in source_steps:
            step_repo.add_existing(step)

        use_case = CopyGuide(guide_repo, step_repo)
        dto = CopyGuideDTO(
            source_guide_id=source_guide.id.value,
            target_language="de",
        )

        _, step_dtos = await use_case.execute(dto, user)

        assert len(step_dtos) == 2
        assert step_dtos[0].title == "Mix ingredients"
        assert step_dtos[0].duration == 600
        assert step_dtos[1].title == "Knead dough"
        assert step_dtos[1].order == 2

    @pytest.mark.asyncio
    async def test_preserves_description(
        self,
        guide_repo: MockGuideRepository,
        step_repo: MockStepRepository,
        user: User,
        source_guide: Guide,
        source_steps: list[Step],
    ):
        guide_repo.add_existing(source_guide)
        for step in source_steps:
            step_repo.add_existing(step)

        use_case = CopyGuide(guide_repo, step_repo)
        dto = CopyGuideDTO(
            source_guide_id=source_guide.id.value,
            target_language="fr",
        )

        guide_dto, _ = await use_case.execute(dto, user)

        assert guide_dto.description == "How to bake bread"

    @pytest.mark.asyncio
    async def test_sets_new_guide_as_private(
        self,
        guide_repo: MockGuideRepository,
        step_repo: MockStepRepository,
        user: User,
        source_guide: Guide,
    ):
        source_guide.make_public()
        guide_repo.add_existing(source_guide)

        use_case = CopyGuide(guide_repo, step_repo)
        dto = CopyGuideDTO(
            source_guide_id=source_guide.id.value,
            target_language="nl",
        )

        guide_dto, _ = await use_case.execute(dto, user)

        assert guide_dto.is_public is False

    @pytest.mark.asyncio
    async def test_sets_owner_to_current_user(
        self,
        guide_repo: MockGuideRepository,
        step_repo: MockStepRepository,
        user: User,
        source_guide: Guide,
    ):
        guide_repo.add_existing(source_guide)

        use_case = CopyGuide(guide_repo, step_repo)
        dto = CopyGuideDTO(
            source_guide_id=source_guide.id.value,
            target_language="nl",
        )

        guide_dto, _ = await use_case.execute(dto, user)

        assert guide_dto.created_by_user_id == user.id.value

    @pytest.mark.asyncio
    async def test_raises_when_source_not_found(
        self,
        guide_repo: MockGuideRepository,
        step_repo: MockStepRepository,
        user: User,
    ):
        use_case = CopyGuide(guide_repo, step_repo)
        dto = CopyGuideDTO(
            source_guide_id=str(uuid4()),
            target_language="nl",
        )

        with pytest.raises(EntityNotFoundException):
            await use_case.execute(dto, user)

    @pytest.mark.asyncio
    async def test_raises_for_invalid_language(
        self,
        guide_repo: MockGuideRepository,
        step_repo: MockStepRepository,
        user: User,
        source_guide: Guide,
    ):
        guide_repo.add_existing(source_guide)

        use_case = CopyGuide(guide_repo, step_repo)
        dto = CopyGuideDTO(
            source_guide_id=source_guide.id.value,
            target_language="invalid",
        )

        with pytest.raises(ValueError):
            await use_case.execute(dto, user)
