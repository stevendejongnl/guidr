"""Get guides by category use case."""

from src.application.dtos import GuideResponseDTO
from src.application.mappers import GuideMapper
from src.domain.repositories import IGuideRepository
from src.domain.value_objects import EntityId


class GetGuidesByCategory:
    """Use case for getting guides by category ID."""

    def __init__(self, guide_repository: IGuideRepository):
        """Initialize use case.

        Args:
            guide_repository: Repository for guide persistence
        """
        self._repository = guide_repository
        self._mapper = GuideMapper()

    async def execute(self, category_id: str, user=None) -> list[GuideResponseDTO]:  # type: ignore[no-untyped-def]
        """Get guides by category ID (filtered by visibility).

        Args:
            category_id: Category ID
            user: Current user (optional, for filtering based on visibility)

        Returns:
            List of GuideResponseDTO
        """
        guides = await self._repository.find_by_category_id(EntityId(category_id))

        # Filter guides based on visibility
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
