"""Get highlighted guides use case."""

from src.application.dtos import GuideResponseDTO
from src.application.mappers import GuideMapper
from src.domain.repositories import IGuideRepository


class GetHighlightedGuides:
    """Use case for getting highlighted guides (featured on homepage)."""

    def __init__(self, guide_repository: IGuideRepository):
        self._repository = guide_repository
        self._mapper = GuideMapper()

    async def execute(self) -> list[GuideResponseDTO]:
        """Get all highlighted guides.

        Returns:
            List of GuideResponseDTO for highlighted guides (may be empty)
        """
        guides = await self._repository.find_highlighted_guides()
        return [self._mapper.to_response_dto(guide) for guide in guides]
