"""Update step use case."""


from src.application.authorization import require_owner_or_admin
from src.application.dtos import StepResponseDTO, StepUpdateDTO
from src.application.mappers import StepMapper
from src.domain.entities import User
from src.domain.exceptions import EntityNotFoundException, ValidationException
from src.domain.repositories import IGuideRepository, IStepRepository
from src.domain.value_objects import EntityId, StepDuration


class UpdateStep:
    """Use case for updating a step."""

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
        self._repository = step_repository
        self._guide_repository = guide_repository
        self._mapper = StepMapper()

    async def execute(
        self, step_id: str, dto: StepUpdateDTO, current_user: User
    ) -> StepResponseDTO | None:
        """Update a step.

        Args:
            step_id: Step ID
            dto: Step update data
            current_user: User updating the step (must be guide owner or admin)

        Returns:
            StepResponseDTO with updated step data

        Raises:
            EntityNotFoundException: If step not found
            ValidationException: If guide not found
            AuthorizationException: If user is not guide owner or admin
        """
        # Find existing step
        step = await self._repository.find_by_id(EntityId(step_id))
        if not step:
            raise EntityNotFoundException(f"Step not found: {step_id}")

        # Load parent guide to check authorization
        guide = await self._guide_repository.find_by_id(step.guide_id)
        if not guide:
            raise ValidationException(f"Guide not found: {step.guide_id}")

        # Check authorization - user must be guide owner or admin
        require_owner_or_admin(current_user, guide.created_by_user_id)

        # Update fields if provided
        if dto.order is not None:
            step.update_order(dto.order)
        if dto.title is not None:
            step.update_title(dto.title)
        if dto.description is not None:
            step.update_description(dto.description)
        if dto.duration is not None:
            step.update_duration(StepDuration(dto.duration))

        # Save and return
        await self._repository.save(step)
        return self._mapper.to_response_dto(step)
