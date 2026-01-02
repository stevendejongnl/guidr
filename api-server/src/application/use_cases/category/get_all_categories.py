"""Get all categories use case."""

from src.domain.repositories import ICategoryRepository
from src.application.dtos import CategoryResponseDTO
from src.application.mappers import CategoryMapper


class GetAllCategories:
    """Use case for getting all categories."""

    def __init__(self, category_repository: ICategoryRepository):
        """Initialize use case.

        Args:
            category_repository: Repository for category persistence
        """
        self._repository = category_repository
        self._mapper = CategoryMapper()

    async def execute(self) -> list[CategoryResponseDTO]:
        """Get all categories.

        Returns:
            List of CategoryResponseDTO
        """
        categories = await self._repository.find_all()
        return [self._mapper.to_response_dto(cat) for cat in categories]
