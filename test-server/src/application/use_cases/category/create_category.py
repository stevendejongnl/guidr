"""Create category use case."""

from uuid import uuid4

from src.domain.entities import Category
from src.domain.repositories import ICategoryRepository
from src.domain.value_objects import EntityId
from src.domain.exceptions import ValidationException
from src.application.dtos import CategoryCreateDTO, CategoryResponseDTO
from src.application.mappers import CategoryMapper


class CreateCategory:
    """Use case for creating a new category."""

    def __init__(self, category_repository: ICategoryRepository):
        """Initialize use case.

        Args:
            category_repository: Repository for category persistence
        """
        self._repository = category_repository
        self._mapper = CategoryMapper()

    async def execute(self, dto: CategoryCreateDTO) -> CategoryResponseDTO:
        """Create a new category.

        Args:
            dto: Category creation data

        Returns:
            CategoryResponseDTO with created category data

        Raises:
            ValidationException: If parent category doesn't exist
        """
        # Validate parent exists if provided
        parent_id = None
        if dto.parent_id:
            parent_id = EntityId(dto.parent_id)
            parent = await self._repository.find_by_id(parent_id)
            if not parent:
                raise ValidationException(
                    f"Parent category not found: {dto.parent_id}"
                )

        # Create entity
        category = Category(
            id=EntityId(str(uuid4())),
            name=dto.name,
            parent_id=parent_id,
        )

        # Save and return
        await self._repository.save(category)
        return self._mapper.to_response_dto(category)
