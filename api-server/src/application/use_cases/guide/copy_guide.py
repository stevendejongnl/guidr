"""Copy guide to a new language use case."""

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


class CopyGuide:
    """Use case for copying a guide to a new language."""

    def __init__(
        self,
        guide_repository: IGuideRepository,
        step_repository: IStepRepository,
    ):
        self._guide_repository = guide_repository
        self._step_repository = step_repository

    async def execute(
        self,
        dto: CopyGuideDTO,
        user: User,
    ) -> tuple[GuideResponseDTO, list[StepResponseDTO]]:
        """Copy a guide with a new language.

        Args:
            dto: Copy guide data (source ID + target language)
            user: Current authenticated user

        Returns:
            Tuple of (new guide response, new step responses)

        Raises:
            EntityNotFoundException: If source guide not found
            ValueError: If target language is invalid
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

        create_dto = CreateGuideWithStepsDTO(
            guide_type=source_guide.guide_type.value,
            title=str(source_guide.title),
            description=source_guide.description,
            metadata=source_guide.metadata,
            is_public=False,
            language=dto.target_language,
            steps=[
                StepInput(
                    order=step.order,
                    title=step.title,
                    description=step.description,
                    duration=(
                        step.duration.value
                        if step.duration
                        else None
                    ),
                )
                for step in source_steps
            ],
        )

        create_use_case = CreateGuideWithSteps(
            self._guide_repository,
            self._step_repository,
        )
        return await create_use_case.execute(create_dto, user)
