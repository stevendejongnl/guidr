"""Category mapper for entity-DTO conversion."""

from src.application.dtos import CategoryResponseDTO
from src.domain.entities import Category


class CategoryMapper:
    """Mapper for Category entity to DTOs."""

    @staticmethod
    def to_response_dto(category: Category) -> CategoryResponseDTO:
        """Convert Category entity to CategoryResponseDTO.

        Args:
            category: Category entity

        Returns:
            CategoryResponseDTO with all category data
        """
        return CategoryResponseDTO(
            id=category.id.value,
            name=category.name,
            parent_id=category.parent_id.value if category.parent_id else None,
            created_at=category.created_at.isoformat(),
            updated_at=category.updated_at.isoformat(),
        )
