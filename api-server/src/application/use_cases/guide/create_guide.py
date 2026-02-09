"""Create guide use case."""

from uuid import uuid4

from src.application.dtos import GuideCreateDTO, GuideResponseDTO
from src.application.mappers import GuideMapper
from src.domain.entities import Guide
from src.domain.repositories import IGuideRepository
from src.domain.value_objects import EntityId, GuideTitle, GuideType


class CreateGuide:
    """Use case for creating a new guide."""

    def __init__(
        self,
        guide_repository: IGuideRepository,
    ):
        """Initialize use case."""
        self._guide_repository = guide_repository
        self._mapper = GuideMapper()

    async def execute(self, dto: GuideCreateDTO, user=None) -> GuideResponseDTO:  # type: ignore[no-untyped-def]
        """Create a new guide.

        Args:
            dto: Guide creation data
            user: Current user (optional)

        Returns:
            GuideResponseDTO with created guide data

        Raises:
            ValueError: If guide_type is invalid
        """
        guide_type = GuideType(dto.guide_type)
        created_by_user_id = (
            EntityId(user.id) if user else None
        )

        guide = Guide(
            id=EntityId(str(uuid4())),
            guide_type=guide_type,
            title=GuideTitle(dto.title),
            description=dto.description,
            metadata=dto.metadata,
            created_by_user_id=created_by_user_id,
        )

        await self._guide_repository.save(guide)
        return self._mapper.to_response_dto(guide)
