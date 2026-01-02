"""Get all guides use case."""

from src.domain.repositories import IGuideRepository
from src.application.dtos import GuideResponseDTO
from src.application.mappers import GuideMapper


class GetAllGuides:
    """Use case for getting all guides."""

    def __init__(self, guide_repository: IGuideRepository):
        """Initialize use case.

        Args:
            guide_repository: Repository for guide persistence
        """
        self._repository = guide_repository
        self._mapper = GuideMapper()

    async def execute(self) -> list[GuideResponseDTO]:
        """Get all guides.

        Returns:
            List of GuideResponseDTO
        """
        guides = await self._repository.find_all()
        return [self._mapper.to_response_dto(guide) for guide in guides]
