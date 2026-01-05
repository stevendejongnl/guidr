"""Create step use case."""

from uuid import uuid4

from src.application.dtos import StepCreateDTO, StepResponseDTO
from src.application.mappers import StepMapper
from src.domain.entities import Step
from src.domain.exceptions import ValidationException
from src.domain.repositories import IGuideRepository, IStepRepository
from src.domain.value_objects import EntityId, StepDuration


class CreateStep:
    """Use case for creating a new step."""

    def __init__(
        self,
        step_repository: IStepRepository,
        guide_repository: IGuideRepository,
    ):
        """Initialize use case.

        Args:
            step_repository: Repository for step persistence
            guide_repository: Repository for guide validation
        """
        self._step_repository = step_repository
        self._guide_repository = guide_repository
        self._mapper = StepMapper()

    async def execute(self, dto: StepCreateDTO) -> StepResponseDTO:
        """Create a new step.

        Args:
            dto: Step creation data

        Returns:
            StepResponseDTO with created step data

        Raises:
            ValidationException: If guide doesn't exist
        """
        # Validate guide exists
        guide_id = EntityId(dto.guide_id)
        guide = await self._guide_repository.find_by_id(guide_id)
        if not guide:
            raise ValidationException(f"Guide not found: {dto.guide_id}")

        # Create entity
        duration = StepDuration(dto.duration) if dto.duration else None
        step = Step(
            id=EntityId(str(uuid4())),
            guide_id=guide_id,
            order=dto.order,
            title=dto.title,
            description=dto.description,
            duration=duration,
        )

        # Save and return
        await self._step_repository.save(step)
        return self._mapper.to_response_dto(step)
