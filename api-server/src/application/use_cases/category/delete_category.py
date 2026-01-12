"""Delete category use case."""

from src.application.authorization import require_admin
from src.domain.entities import User
from src.domain.events import CategoryDeleted
from src.domain.exceptions import EntityNotFoundException
from src.domain.repositories import ICategoryRepository
from src.domain.services import EventPersistenceService
from src.domain.value_objects import EntityId


class DeleteCategory:
    """Use case for deleting a category."""

    def __init__(
        self,
        category_repository: ICategoryRepository,
        event_persistence_service: EventPersistenceService,
    ):
        """Initialize use case.

        Args:
            category_repository: Repository for category persistence
            event_persistence_service: Service for persisting domain events
        """
        self._repository = category_repository
        self._event_persistence = event_persistence_service

    async def execute(self, category_id: str, current_user: User) -> None:
        """Delete a category (admin only).

        Args:
            category_id: Category ID
            current_user: User performing the deletion (must be admin)

        Raises:
            AuthorizationException: If user is not an admin
            EntityNotFoundException: If category not found
        """
        require_admin(current_user)

        # Fetch category for audit details
        category = await self._repository.find_by_id(EntityId(category_id))
        if not category:
            raise EntityNotFoundException(f"Category not found: {category_id}")

        # Delete category
        await self._repository.delete(EntityId(category_id))

        # Persist event
        delete_event = CategoryDeleted(
            category_id=category_id,
            name=category.name,
        )
        await self._event_persistence.persist_event(
            delete_event,
            user_id=current_user.id.value,
        )
