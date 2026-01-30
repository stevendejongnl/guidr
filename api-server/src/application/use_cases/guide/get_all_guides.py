"""Get all guides use case."""

from src.application.dtos import GuideResponseDTO
from src.application.mappers import GuideMapper
from src.domain.repositories import IGuideRepository


class GetAllGuides:
    """Use case for getting all guides."""

    def __init__(self, guide_repository: IGuideRepository):
        """Initialize use case.

        Args:
            guide_repository: Repository for guide persistence
        """
        self._repository = guide_repository
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

        return [self._mapper.to_response_dto(guide) for guide in filtered_guides]
