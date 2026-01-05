"""Get guide use case."""


from src.application.dtos import GuideResponseDTO
from src.application.mappers import GuideMapper
from src.domain.repositories import IGuideRepository
from src.domain.value_objects import EntityId


class GetGuide:
    """Use case for getting a guide by ID."""

    def __init__(self, guide_repository: IGuideRepository):
        """Initialize use case.

        Args:
            guide_repository: Repository for guide persistence
        """
        self._repository = guide_repository
        self._mapper = GuideMapper()

    async def execute(self, guide_id: str) -> GuideResponseDTO | None:
        """Get a guide by ID.

        Args:
            guide_id: Guide ID

        Returns:
            GuideResponseDTO if found, None otherwise
        """
        guide = await self._repository.find_by_id(EntityId(guide_id))
        if not guide:
            return None
        return self._mapper.to_response_dto(guide)
