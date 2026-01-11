"""Update category use case."""


from src.application.authorization import require_admin
from src.application.dtos import CategoryResponseDTO, CategoryUpdateDTO
from src.application.mappers import CategoryMapper
from src.domain.entities import User
from src.domain.exceptions import EntityNotFoundException
from src.domain.repositories import ICategoryRepository
from src.domain.value_objects import EntityId


class UpdateCategory:
    """Use case for updating a category."""

    def __init__(self, category_repository: ICategoryRepository):
        """Initialize use case.

        Args:
            category_repository: Repository for category persistence
        """
        self._repository = category_repository
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

        # Save and return
        await self._repository.save(category)
        return self._mapper.to_response_dto(category)
