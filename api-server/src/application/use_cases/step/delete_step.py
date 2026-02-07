"""Delete step use case."""

from src.application.authorization import require_owner_or_admin
from src.domain.entities import User
from src.domain.exceptions import EntityNotFoundException, ValidationException
from src.domain.repositories import IGuideRepository, IStepRepository
from src.domain.value_objects import EntityId


class DeleteStep:
    """Use case for deleting a step."""

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

    async def execute(self, step_id: str, current_user: User) -> None:
        """Delete a step.

        Args:
            step_id: Step ID
            current_user: User deleting the step (must be guide owner or admin)

        Raises:
            EntityNotFoundException: If step not found
            ValidationException: If guide not found
            AuthorizationException: If user is not guide owner or admin
        """
        # Load step to get guide reference
        step = await self._repository.find_by_id(EntityId(step_id))
        if not step:
            raise EntityNotFoundException(f"Step not found: {step_id}")

        # Load parent guide to check authorization
        guide = await self._guide_repository.find_by_id(step.guide_id)
        if not guide:
            raise ValidationException(f"Guide not found: {step.guide_id}")

        # Check authorization - user must be guide owner or admin
        require_owner_or_admin(current_user, guide.created_by_user_id)

        # Delete the step
        await self._repository.delete(EntityId(step_id))
