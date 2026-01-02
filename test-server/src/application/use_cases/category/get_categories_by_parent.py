"""Get categories by parent use case."""

from typing import Optional

from src.domain.repositories import ICategoryRepository
from src.domain.value_objects import EntityId
from src.application.dtos import CategoryResponseDTO
from src.application.mappers import CategoryMapper


class GetCategoriesByParent:
    """Use case for getting categories by parent ID."""

    def __init__(self, category_repository: ICategoryRepository):
        """Initialize use case.

        Args:
            category_repository: Repository for category persistence
        """
        self._repository = category_repository
        self._mapper = CategoryMapper()

    async def execute(self, parent_id: Optional[str]) -> list[CategoryResponseDTO]:
        """Get categories by parent ID.

        Args:
            parent_id: Parent category ID (None for root categories)

        Returns:
            List of CategoryResponseDTO
        """
        parent_entity_id = EntityId(parent_id) if parent_id else None
        categories = await self._repository.find_by_parent_id(parent_entity_id)
        return [self._mapper.to_response_dto(cat) for cat in categories]
