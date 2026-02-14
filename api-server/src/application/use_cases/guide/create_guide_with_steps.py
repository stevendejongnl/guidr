"""Create guide with steps use case."""

from uuid import uuid4

from src.application.dtos import (
    GuideResponseDTO,
    StepResponseDTO,
)
from src.application.dtos.guide_with_steps_dtos import (
    CreateGuideWithStepsDTO,
)
from src.application.mappers import GuideMapper, StepMapper
from src.domain.entities import Guide, Step
from src.domain.repositories import (
    IGuideRepository,
    IStepRepository,
)
from src.domain.value_objects import (
    EntityId,
    GuideTitle,
    GuideType,
    StepDuration,
)
from src.domain.value_objects.guide_type import validate_metadata


class CreateGuideWithSteps:
    """Use case for creating a guide with steps atomically."""

    def __init__(
        self,
        guide_repository: IGuideRepository,
        step_repository: IStepRepository,
    ):
        self._guide_repository = guide_repository
        self._step_repository = step_repository
        self._guide_mapper = GuideMapper()
        self._step_mapper = StepMapper()

    async def execute(
        self,
        dto: CreateGuideWithStepsDTO,
        user=None,  # type: ignore[no-untyped-def]
    ) -> tuple[GuideResponseDTO, list[StepResponseDTO]]:
        """Create a guide and its steps.

        Args:
            dto: Guide and steps data
            user: Current user (optional)

        Returns:
            Tuple of (guide response, step responses)

        Raises:
            ValueError: If guide_type or metadata is invalid
        """
        guide_type = GuideType(dto.guide_type)
        validate_metadata(guide_type, dto.metadata)

        created_by = (
            EntityId(user.id) if user else None
        )

        guide = Guide(
            id=EntityId(str(uuid4())),
            guide_type=guide_type,
            title=GuideTitle(dto.title),
            description=dto.description,
            metadata=dto.metadata,
            created_by_user_id=created_by,
            is_public=dto.is_public,
        )

        await self._guide_repository.save(guide)

        steps: list[Step] = []
        for step_input in dto.steps:
            duration = (
                StepDuration(step_input.duration)
                if step_input.duration
                else None
            )
            step = Step(
                id=EntityId(str(uuid4())),
                guide_id=guide.id,
                order=step_input.order,
                title=step_input.title,
                description=step_input.description,
                duration=duration,
            )
            await self._step_repository.save(step)
            steps.append(step)

        guide_dto = self._guide_mapper.to_response_dto(guide)
        step_dtos = [
            self._step_mapper.to_response_dto(s)
            for s in steps
        ]

        return guide_dto, step_dtos
