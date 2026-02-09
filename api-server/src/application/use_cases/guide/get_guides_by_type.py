"""Get guides by type use case."""

from src.application.dtos import GuideResponseDTO
from src.application.mappers import GuideMapper
from src.domain.repositories import IGuideRepository
from src.domain.value_objects import GuideType


class GetGuidesByType:
    """Use case for getting guides by type."""

    def __init__(self, guide_repository: IGuideRepository):
        """Initialize use case."""
        self._repository = guide_repository
        self._mapper = GuideMapper()

    async def execute(self, guide_type: str, user=None) -> list[GuideResponseDTO]:  # type: ignore[no-untyped-def]
        """Get guides by type (filtered by visibility).

        Args:
            guide_type: Guide type string
            user: Current user (optional)

        Returns:
            List of GuideResponseDTO
        """
        gt = GuideType(guide_type)
        guides = await self._repository.find_by_type(gt)

        filtered_guides = []
        for guide in guides:
            if user and user.is_admin:
                filtered_guides.append(guide)
            elif guide.is_public:
                filtered_guides.append(guide)
            elif (
                user
                and guide.created_by_user_id
                and str(guide.created_by_user_id)
                == str(user.id)
            ):
                filtered_guides.append(guide)

        return [
            self._mapper.to_response_dto(guide)
            for guide in filtered_guides
        ]
