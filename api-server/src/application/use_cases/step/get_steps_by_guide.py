"""Get steps by guide use case."""

from src.application.authorization import can_view_guide
from src.application.dtos import StepResponseDTO
from src.application.mappers import StepMapper
from src.domain.entities import User
from src.domain.exceptions import AuthorizationException
from src.domain.repositories import IGuideRepository, IStepRepository
from src.domain.value_objects import EntityId


class GetStepsByGuide:
    """Use case for getting steps by guide ID."""

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
        self, guide_id: str, current_user: User | None = None
    ) -> list[StepResponseDTO]:
        """Get steps by guide ID, ordered by order field.

        Args:
            guide_id: Guide ID
            current_user: User requesting the steps (None for unauthenticated)

        Returns:
            List of StepResponseDTO ordered by order field

        Raises:
            AuthorizationException: If guide is private and user can't view it
        """
        # Check if user can view the guide first
        guide = await self._guide_repository.find_by_id(EntityId(guide_id))
        if guide and not can_view_guide(current_user, guide):
            raise AuthorizationException(
                "You are not authorized to access this resource"
            )

        # Get and return steps
        steps = await self._repository.find_by_guide_id(EntityId(guide_id))
        return [self._mapper.to_response_dto(step) for step in steps]
