"""Get all guides use case."""

from src.application.dtos import GuideResponseDTO
from src.application.mappers import GuideMapper
from src.domain.repositories import IGuideRepository, IStepRepository
from src.domain.value_objects import EntityId


class GetAllGuides:
    """Use case for getting all guides."""

    def __init__(self, guide_repository: IGuideRepository, step_repository: IStepRepository):
        """Initialize use case.

        Args:
            guide_repository: Repository for guide persistence
            step_repository: Repository for step persistence (for total duration)
        """
        self._repository = guide_repository
        self._step_repository = step_repository
        self._mapper = GuideMapper()

    async def execute(self, user=None) -> list[GuideResponseDTO]:  # type: ignore[no-untyped-def]
        """Get all guides (filtered by visibility).

        Args:
            user: Current user (optional, for filtering based on visibility)

        Returns:
            List of GuideResponseDTO
        """
        guides = await self._repository.find_all()

        # Filter guides based on visibility
        # For now, return all public guides and user's own guides
        filtered_guides = []
        for guide in guides:
            # Admin can see all guides
            if user and user.is_admin:
                filtered_guides.append(guide)
            # Public guides visible to everyone
            elif guide.is_public:
                filtered_guides.append(guide)
            # User's own guides visible to them
            elif (
                user
                and guide.created_by_user_id
                and str(guide.created_by_user_id) == str(user.id)
            ):
                filtered_guides.append(guide)

        result = []
        for guide in filtered_guides:
            steps = await self._step_repository.find_by_guide_id(EntityId(guide.id.value))
            total_duration = sum(
                s.duration.value for s in steps if s.duration is not None
            ) or None
            result.append(self._mapper.to_response_dto(guide, total_duration=total_duration))
        return result
