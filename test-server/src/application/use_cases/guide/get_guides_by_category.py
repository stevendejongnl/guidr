"""Get guides by category use case."""

from src.domain.repositories import IGuideRepository
from src.domain.value_objects import EntityId
from src.application.dtos import GuideResponseDTO
from src.application.mappers import GuideMapper


class GetGuidesByCategory:
    """Use case for getting guides by category ID."""

    def __init__(self, guide_repository: IGuideRepository):
        """Initialize use case.

        Args:
            guide_repository: Repository for guide persistence
        """
        self._repository = guide_repository
        self._mapper = GuideMapper()

    async def execute(self, category_id: str) -> list[GuideResponseDTO]:
        """Get guides by category ID.

        Args:
            category_id: Category ID

        Returns:
            List of GuideResponseDTO
        """
        guides = await self._repository.find_by_category_id(EntityId(category_id))
        return [self._mapper.to_response_dto(guide) for guide in guides]
