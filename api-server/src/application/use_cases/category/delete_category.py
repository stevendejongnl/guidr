"""Delete category use case."""

from src.domain.repositories import ICategoryRepository
from src.domain.value_objects import EntityId


class DeleteCategory:
    """Use case for deleting a category."""

    def __init__(self, category_repository: ICategoryRepository):
        """Initialize use case.

        Args:
            category_repository: Repository for category persistence
        """
        self._repository = category_repository

    async def execute(self, category_id: str) -> None:
        """Delete a category.

        Args:
            category_id: Category ID
        """
        await self._repository.delete(EntityId(category_id))
