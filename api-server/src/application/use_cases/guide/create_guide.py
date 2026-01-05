"""Create guide use case."""

from uuid import uuid4

from src.application.dtos import GuideCreateDTO, GuideResponseDTO
from src.application.mappers import GuideMapper
from src.domain.entities import Guide
from src.domain.exceptions import ValidationException
from src.domain.repositories import ICategoryRepository, IGuideRepository
from src.domain.value_objects import EntityId, GuideTitle


class CreateGuide:
    """Use case for creating a new guide."""

    def __init__(
        self,
        guide_repository: IGuideRepository,
        category_repository: ICategoryRepository,
    ):
        """Initialize use case.

        Args:
            guide_repository: Repository for guide persistence
            category_repository: Repository for category validation
        """
        self._guide_repository = guide_repository
        self._category_repository = category_repository
        self._mapper = GuideMapper()

    async def execute(self, dto: GuideCreateDTO) -> GuideResponseDTO:
        """Create a new guide.

        Args:
            dto: Guide creation data

        Returns:
            GuideResponseDTO with created guide data

        Raises:
            ValidationException: If category doesn't exist
        """
        # Validate category exists
        category_id = EntityId(dto.category_id)
        category = await self._category_repository.find_by_id(category_id)
        if not category:
            raise ValidationException(f"Category not found: {dto.category_id}")

        # Create entity
        guide = Guide(
            id=EntityId(str(uuid4())),
            category_id=category_id,
            title=GuideTitle(dto.title),
            description=dto.description,
        )

        # Save and return
        await self._guide_repository.save(guide)
        return self._mapper.to_response_dto(guide)
