"""Get category use case."""

from typing import Optional

from src.domain.repositories import ICategoryRepository
from src.domain.value_objects import EntityId
from src.application.dtos import CategoryResponseDTO
from src.application.mappers import CategoryMapper


class GetCategory:
    """Use case for getting a category by ID."""

    def __init__(self, category_repository: ICategoryRepository):
        """Initialize use case.

        Args:
            category_repository: Repository for category persistence
        """
        self._repository = category_repository
        self._mapper = CategoryMapper()

    async def execute(self, category_id: str) -> Optional[CategoryResponseDTO]:
        """Get a category by ID.

        Args:
            category_id: Category ID

        Returns:
            CategoryResponseDTO if found, None otherwise
        """
        category = await self._repository.find_by_id(EntityId(category_id))
        if not category:
            return None
        return self._mapper.to_response_dto(category)
