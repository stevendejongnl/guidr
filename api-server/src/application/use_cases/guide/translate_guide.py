"""Translate guide to a new language using AI."""

from src.application.dtos import CopyGuideDTO, GuideResponseDTO, StepResponseDTO
from src.application.dtos.guide_with_steps_dtos import (
    CreateGuideWithStepsDTO,
    StepInput,
)
from src.application.use_cases.guide.create_guide_with_steps import (
    CreateGuideWithSteps,
)
from src.domain.entities import User
from src.domain.exceptions import EntityNotFoundException
from src.domain.repositories import IGuideRepository, IStepRepository
from src.domain.value_objects import EntityId, Language
from src.infrastructure.ai.llm_service import LLMService


class TranslateGuide:
    """Use case for translating a guide to a new language via AI."""

    def __init__(
        self,
        guide_repository: IGuideRepository,
        step_repository: IStepRepository,
        llm_service: LLMService,
    ):
        self._guide_repository = guide_repository
        self._step_repository = step_repository
        self._llm_service = llm_service

    async def execute(
        self,
        dto: CopyGuideDTO,
        user: User,
    ) -> tuple[GuideResponseDTO, list[StepResponseDTO]]:
        """Translate a guide to a new language using AI.

        Args:
            dto: Copy guide data (source ID + target language)
            user: Current authenticated user

        Returns:
            Tuple of (new guide response, new step responses)

        Raises:
            EntityNotFoundException: If source guide not found
            ValueError: If target language is invalid
            LLMServiceError: If AI translation fails
        """
        Language(dto.target_language)

        source_guide = await self._guide_repository.find_by_id(
            EntityId(dto.source_guide_id)
        )
        if not source_guide:
            raise EntityNotFoundException(
                f"Guide not found: {dto.source_guide_id}"
            )

        source_steps = (
            await self._step_repository.find_by_guide_id(
                source_guide.id
            )
        )
        source_steps.sort(key=lambda s: s.order)

        steps_data: list[dict[str, object]] = [
            {
                "order": step.order,
                "title": step.title,
                "description": step.description,
                "duration": (
                    step.duration.value // 60
                    if step.duration
                    else None
                ),
            }
            for step in source_steps
        ]

        metadata: dict[str, object] | None = None
        if source_guide.metadata:
            metadata = dict(source_guide.metadata)

        translated = await self._llm_service.translate_guide(
            guide_title=str(source_guide.title),
            guide_description=source_guide.description,
            steps=steps_data,
            metadata=metadata,
            guide_type=source_guide.guide_type.value,
            target_language=dto.target_language,
        )

        create_dto = CreateGuideWithStepsDTO(
            guide_type=translated.guide_type,
            title=translated.title,
            description=translated.description,
            metadata=translated.metadata,
            is_public=False,
            language=dto.target_language,
            steps=[
                StepInput(
                    order=s.order,
                    title=s.title,
                    description=s.description,
                    duration=(
                        s.duration * 60 if s.duration else None
                    ),
                )
                for s in translated.steps
            ],
        )

        create_use_case = CreateGuideWithSteps(
            self._guide_repository,
            self._step_repository,
        )
        return await create_use_case.execute(create_dto, user)
