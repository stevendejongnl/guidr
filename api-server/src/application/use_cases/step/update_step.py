"""Update step use case."""


from src.application.dtos import StepResponseDTO, StepUpdateDTO
from src.application.mappers import StepMapper
from src.domain.exceptions import EntityNotFoundException
from src.domain.repositories import IStepRepository
from src.domain.value_objects import EntityId, StepDuration


class UpdateStep:
    """Use case for updating a step."""

    def __init__(self, step_repository: IStepRepository):
        """Initialize use case.

        Args:
            step_repository: Repository for step persistence
        """
        self._repository = step_repository
        self._mapper = StepMapper()

    async def execute(
        self, step_id: str, dto: StepUpdateDTO
    ) -> StepResponseDTO | None:
        """Update a step.

        Args:
            step_id: Step ID
            dto: Step update data

        Returns:
            StepResponseDTO with updated step data

        Raises:
            EntityNotFoundException: If step not found
        """
        # Find existing step
        step = await self._repository.find_by_id(EntityId(step_id))
        if not step:
            raise EntityNotFoundException(f"Step not found: {step_id}")

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
