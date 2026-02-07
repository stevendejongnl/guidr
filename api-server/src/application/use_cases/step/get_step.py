"""Get step use case."""


from src.application.authorization import can_view_guide
from src.application.dtos import StepResponseDTO
from src.application.mappers import StepMapper
from src.domain.entities import User
from src.domain.repositories import IGuideRepository, IStepRepository
from src.domain.value_objects import EntityId


class GetStep:
    """Use case for getting a step by ID."""

    def __init__(
        self,
        step_repository: IStepRepository,
        guide_repository: IGuideRepository,
    ):
        """Initialize use case.

        Args:
            step_repository: Repository for step persistence
            guide_repository: Repository for guide visibility checks
        """
        self._repository = step_repository
        self._guide_repository = guide_repository
        self._mapper = StepMapper()

    async def execute(
        self, step_id: str, current_user: User | None = None
    ) -> StepResponseDTO | None:
        """Get a step by ID.

        Args:
            step_id: Step ID
            current_user: User requesting the step (None for unauthenticated)

        Returns:
            StepResponseDTO if found and user has access, None otherwise
        """
        step = await self._repository.find_by_id(EntityId(step_id))
        if not step:
            return None

        # Check if user can view the guide containing this step
        guide = await self._guide_repository.find_by_id(step.guide_id)
        if not guide:
            # Guide was deleted, step is orphaned - treat as not found
            return None

        # Apply guide visibility rules to step access
        if not can_view_guide(current_user, guide):
            return None

        return self._mapper.to_response_dto(step)
