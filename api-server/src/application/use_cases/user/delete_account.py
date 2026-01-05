"""Delete account use case."""

from src.application.dtos import DeleteAccountDTO
from src.domain.exceptions import ValidationException
from src.domain.repositories import IUserRepository
from src.infrastructure.auth import PasswordHasher


class DeleteAccount:
    """Use case for deleting user account."""

    def __init__(
        self,
        user_repository: IUserRepository,
        password_hasher: PasswordHasher,
    ):
        """Initialize the use case.

        Args:
            user_repository: Repository for user persistence
            password_hasher: Service for password verification
        """
        self._user_repository = user_repository
        self._password_hasher = password_hasher

    async def execute(self, dto: DeleteAccountDTO) -> None:
        """Execute the delete account use case.

        Args:
            dto: Delete account data transfer object

        Raises:
            ValidationException: If user not found or password incorrect
        """
        # Fetch user by ID
        user = await self._user_repository.find_by_id(dto.user_id, authToken="")
        if user is None:
            raise ValidationException("User not found")

        # Verify password (security check before deletion)
        is_valid = self._password_hasher.verify_password(
            dto.password, user.password_hash
        )
        if not is_valid:
            raise ValidationException("Password is incorrect")

        # Delete user (emits UserDeleted event)
        await self._user_repository.delete(dto.user_id, authToken="")
