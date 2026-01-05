"""Change password use case."""

from src.application.dtos import ChangePasswordDTO
from src.domain.exceptions import ValidationException
from src.domain.repositories import IUserRepository
from src.domain.value_objects import Password
from src.domain.value_objects.entity_id import EntityId
from src.infrastructure.auth import PasswordHasher


class ChangePassword:
    """Use case for changing user password."""

    def __init__(
        self,
        user_repository: IUserRepository,
        password_hasher: PasswordHasher,
    ):
        """Initialize use case with dependencies.

        Args:
            user_repository: Repository for user persistence
            password_hasher: Service for password hashing and verification
        """
        self._user_repository = user_repository
        self._password_hasher = password_hasher

    async def execute(self, dto: ChangePasswordDTO) -> None:
        """Execute password change.

        Args:
            dto: DTO containing user ID, old password, and new password

        Raises:
            ValidationException: If user not found, old password incorrect,
                               or new password invalid
        """
        # Fetch user by ID
        user_id = EntityId(dto.user_id)
        user = await self._user_repository.find_by_id(user_id)
        if user is None:
            raise ValidationException("User not found")

        # Verify old password
        is_valid = self._password_hasher.verify_password(
            dto.old_password,
            user.password_hash
        )
        if not is_valid:
            raise ValidationException("Current password is incorrect")

        # Validate new password using Password value object
        try:
            Password(dto.new_password)
        except ValidationException as e:
            raise e

        # Hash new password
        new_hash = self._password_hasher.hash_password(dto.new_password)

        # Update user password (emits UserPasswordChanged event)
        user.update_password_hash(new_hash)

        # Save user
        await self._user_repository.save(user)
