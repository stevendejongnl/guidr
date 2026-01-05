"""Update profile use case."""

from src.application.dtos import UpdateProfileDTO
from src.domain.exceptions import ValidationException
from src.domain.repositories import IUserRepository
from src.domain.value_objects.entity_id import EntityId


class UpdateProfile:
    """Use case for updating user profile (name and interests)."""

    def __init__(
        self,
        user_repository: IUserRepository,
    ):
        """Initialize the use case.

        Args:
            user_repository: Repository for user persistence
        """
        self._user_repository = user_repository

    async def execute(self, dto: UpdateProfileDTO) -> None:
        """Execute the update profile use case.

        Args:
            dto: Update profile data transfer object

        Raises:
            ValidationException: If user not found
        """
        # Fetch user by ID
        user_id = EntityId(dto.user_id)
        user = await self._user_repository.find_by_id(user_id)
        if user is None:
            raise ValidationException("User not found")

        # Update name if provided
        if dto.name is not None:
            user.update_name(dto.name)

        # Update interests if provided
        if dto.interests is not None:
            user.set_interests(dto.interests)

        # Persist changes (emits UserProfileUpdated event)
        await self._user_repository.save(user)
