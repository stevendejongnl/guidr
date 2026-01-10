"""Delete category use case."""

from src.application.authorization import require_admin
from src.domain.entities import User
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

    async def execute(self, category_id: str, current_user: User) -> None:
        """Delete a category (admin only).

        Args:
            category_id: Category ID
            current_user: User performing the deletion (must be admin)

        Raises:
            AuthorizationException: If user is not an admin
        """
        require_admin(current_user)
        await self._repository.delete(EntityId(category_id))
