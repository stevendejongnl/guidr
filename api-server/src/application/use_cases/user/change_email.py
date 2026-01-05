"""Change email use case."""

from src.application.dtos import ChangeEmailDTO
from src.domain.exceptions import ValidationException
from src.domain.repositories import IUserRepository
from src.domain.value_objects import Email
from src.domain.value_objects.entity_id import EntityId
from src.infrastructure.auth import PasswordHasher


class ChangeEmail:
    """Use case for changing user email."""

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

    async def execute(self, dto: ChangeEmailDTO) -> None:
        """Execute the change email use case.

        Args:
            dto: Change email data transfer object

        Raises:
            ValidationException: If user not found, password incorrect,
                                email invalid, or email already in use
        """
        # Fetch user by ID
        user_id = EntityId(dto.user_id)
        user = await self._user_repository.find_by_id(user_id)
        if user is None:
            raise ValidationException("User not found")

        # Verify password (security check before email change)
        is_valid = self._password_hasher.verify_password(
            dto.password, user.password_hash
        )
        if not is_valid:
            raise ValidationException("Password is incorrect")

        # Validate new email format using Email value object
        try:
            new_email = Email(dto.new_email)
        except ValueError as e:
            raise ValidationException(str(e))

        # Check that new email is not already in use
        existing_user = await self._user_repository.find_by_email(new_email)
        if existing_user is not None:
            raise ValidationException("Email already in use")

        # Update email on user entity (emits UserEmailChanged event)
        user.update_email(new_email)

        # Persist changes
        await self._user_repository.save(user)
