"""Update category use case."""


from src.application.authorization import require_admin
from src.application.dtos import CategoryResponseDTO, CategoryUpdateDTO
from src.application.mappers import CategoryMapper
from src.domain.entities import User
from src.domain.events import CategoryUpdated
from src.domain.exceptions import EntityNotFoundException
from src.domain.repositories import ICategoryRepository
from src.domain.services import EventPersistenceService
from src.domain.value_objects import EntityId


class UpdateCategory:
    """Use case for updating a category."""

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
        self._mapper = CategoryMapper()

    async def execute(
        self, category_id: str, dto: CategoryUpdateDTO, current_user: User
    ) -> CategoryResponseDTO | None:
        """Update a category (admin only).

        Args:
            category_id: Category ID
            dto: Category update data
            current_user: User performing the update (must be admin)

        Returns:
            CategoryResponseDTO with updated category data

        Raises:
            AuthorizationException: If user is not an admin
            EntityNotFoundException: If category not found
        """
        require_admin(current_user)

        # Find existing category
        category = await self._repository.find_by_id(EntityId(category_id))
        if not category:
            raise EntityNotFoundException(f"Category not found: {category_id}")

        # Update fields if provided
        if dto.name is not None:
            category.update_name(dto.name)

        # Save category
        await self._repository.save(category)

        # Persist event
        update_event = CategoryUpdated(
            category_id=category_id,
            name=category.name,
            parent_id=category.parent_id.value if category.parent_id else None,
        )
        await self._event_persistence.persist_event(
            update_event,
            user_id=current_user.id.value,
        )

        return self._mapper.to_response_dto(category)
