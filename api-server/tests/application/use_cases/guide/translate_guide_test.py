"""Tests for TranslateGuide use case."""

from uuid import uuid4

import pytest

from src.application.dtos import CopyGuideDTO
from src.application.dtos.generation_dtos import (
    GeneratedGuideDTO,
    GeneratedStepDTO,
)
from src.application.use_cases.guide.translate_guide import (
    TranslateGuide,
)
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
from src.infrastructure.ai.llm_service import LLMService


class MockLLMService(LLMService):
    """Mock LLM service for testing translation."""

    def __init__(
        self, result: GeneratedGuideDTO | None = None
    ):
        self._result = result or GeneratedGuideDTO(
            guide_type="cooking",
            title="Brood Bakken",
            description="Hoe brood te bakken",
            steps=[
                GeneratedStepDTO(
                    order=1,
                    title="Meng ingredienten",
                    description="Meng bloem en water",
                    duration=10,
                ),
                GeneratedStepDTO(
                    order=2,
                    title="Kneed deeg",
                    duration=5,
                ),
            ],
        )
        self.translate_called = False
        self.last_target_language: str | None = None
        self.last_guide_title: str | None = None
        self.last_steps: list[dict[str, object]] = []

    async def generate_guide(
        self,
        prompt: str,
        guide_type: str | None = None,
        language: str = "en",
    ) -> GeneratedGuideDTO:
        raise NotImplementedError

    async def translate_guide(
        self,
        guide_title: str,
        guide_description: str | None,
        steps: list[dict[str, object]],
        metadata: dict[str, object] | None,
        guide_type: str,
        target_language: str,
    ) -> GeneratedGuideDTO:
        self.translate_called = True
        self.last_target_language = target_language
        self.last_guide_title = guide_title
        self.last_steps = steps
        return self._result


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


class TestTranslateGuide:
    """Tests for TranslateGuide use case."""

    @pytest.fixture
    def guide_repo(self) -> MockGuideRepository:
        return MockGuideRepository()

    @pytest.fixture
    def step_repo(self) -> MockStepRepository:
        return MockStepRepository()

    @pytest.fixture
    def llm_service(self) -> MockLLMService:
        return MockLLMService()

    @pytest.fixture
    def user(self) -> User:
        return User(
            id=EntityId(str(uuid4())),
            email=Email("user@example.com"),
            password_hash="hashed",
        )

    @pytest.fixture
    def source_guide(self) -> Guide:
        return Guide(
            id=EntityId(str(uuid4())),
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
    async def test_translates_guide_via_llm(
        self,
        guide_repo: MockGuideRepository,
        step_repo: MockStepRepository,
        llm_service: MockLLMService,
        user: User,
        source_guide: Guide,
        source_steps: list[Step],
    ):
        guide_repo.add_existing(source_guide)
        for step in source_steps:
            step_repo.add_existing(step)

        use_case = TranslateGuide(
            guide_repo, step_repo, llm_service
        )
        dto = CopyGuideDTO(
            source_guide_id=source_guide.id.value,
            target_language="nl",
        )

        guide_dto, step_dtos = await use_case.execute(
            dto, user
        )

        assert llm_service.translate_called
        assert guide_dto.title == "Brood Bakken"
        assert guide_dto.language == "nl"

    @pytest.mark.asyncio
    async def test_passes_target_language_to_llm(
        self,
        guide_repo: MockGuideRepository,
        step_repo: MockStepRepository,
        llm_service: MockLLMService,
        user: User,
        source_guide: Guide,
        source_steps: list[Step],
    ):
        guide_repo.add_existing(source_guide)
        for step in source_steps:
            step_repo.add_existing(step)

        use_case = TranslateGuide(
            guide_repo, step_repo, llm_service
        )
        dto = CopyGuideDTO(
            source_guide_id=source_guide.id.value,
            target_language="de",
        )

        await use_case.execute(dto, user)

        assert llm_service.last_target_language == "de"

    @pytest.mark.asyncio
    async def test_converts_duration_seconds_to_minutes(
        self,
        guide_repo: MockGuideRepository,
        step_repo: MockStepRepository,
        llm_service: MockLLMService,
        user: User,
        source_guide: Guide,
        source_steps: list[Step],
    ):
        guide_repo.add_existing(source_guide)
        for step in source_steps:
            step_repo.add_existing(step)

        use_case = TranslateGuide(
            guide_repo, step_repo, llm_service
        )
        dto = CopyGuideDTO(
            source_guide_id=source_guide.id.value,
            target_language="nl",
        )

        await use_case.execute(dto, user)

        # 600s -> 10min, 300s -> 5min
        assert llm_service.last_steps[0]["duration"] == 10
        assert llm_service.last_steps[1]["duration"] == 5

    @pytest.mark.asyncio
    async def test_converts_translated_duration_to_seconds(
        self,
        guide_repo: MockGuideRepository,
        step_repo: MockStepRepository,
        llm_service: MockLLMService,
        user: User,
        source_guide: Guide,
        source_steps: list[Step],
    ):
        guide_repo.add_existing(source_guide)
        for step in source_steps:
            step_repo.add_existing(step)

        use_case = TranslateGuide(
            guide_repo, step_repo, llm_service
        )
        dto = CopyGuideDTO(
            source_guide_id=source_guide.id.value,
            target_language="nl",
        )

        _, step_dtos = await use_case.execute(dto, user)

        # LLM returns 10min and 5min -> stored as 600s, 300s
        assert step_dtos[0].duration == 600
        assert step_dtos[1].duration == 300

    @pytest.mark.asyncio
    async def test_creates_translated_steps(
        self,
        guide_repo: MockGuideRepository,
        step_repo: MockStepRepository,
        llm_service: MockLLMService,
        user: User,
        source_guide: Guide,
        source_steps: list[Step],
    ):
        guide_repo.add_existing(source_guide)
        for step in source_steps:
            step_repo.add_existing(step)

        use_case = TranslateGuide(
            guide_repo, step_repo, llm_service
        )
        dto = CopyGuideDTO(
            source_guide_id=source_guide.id.value,
            target_language="nl",
        )

        _, step_dtos = await use_case.execute(dto, user)

        assert len(step_dtos) == 2
        assert step_dtos[0].title == "Meng ingredienten"
        assert step_dtos[1].title == "Kneed deeg"

    @pytest.mark.asyncio
    async def test_raises_when_source_not_found(
        self,
        guide_repo: MockGuideRepository,
        step_repo: MockStepRepository,
        llm_service: MockLLMService,
        user: User,
    ):
        use_case = TranslateGuide(
            guide_repo, step_repo, llm_service
        )
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
        llm_service: MockLLMService,
        user: User,
        source_guide: Guide,
    ):
        guide_repo.add_existing(source_guide)

        use_case = TranslateGuide(
            guide_repo, step_repo, llm_service
        )
        dto = CopyGuideDTO(
            source_guide_id=source_guide.id.value,
            target_language="invalid",
        )

        with pytest.raises(ValueError):
            await use_case.execute(dto, user)

    @pytest.mark.asyncio
    async def test_sets_new_guide_as_private(
        self,
        guide_repo: MockGuideRepository,
        step_repo: MockStepRepository,
        llm_service: MockLLMService,
        user: User,
        source_guide: Guide,
        source_steps: list[Step],
    ):
        source_guide.make_public()
        guide_repo.add_existing(source_guide)
        for step in source_steps:
            step_repo.add_existing(step)

        use_case = TranslateGuide(
            guide_repo, step_repo, llm_service
        )
        dto = CopyGuideDTO(
            source_guide_id=source_guide.id.value,
            target_language="nl",
        )

        guide_dto, _ = await use_case.execute(dto, user)

        assert guide_dto.is_public is False
