"""Login user use case."""

from typing import Protocol

from src.application.dtos import UserLoginDTO, UserResponseDTO
from src.application.mappers import UserMapper
from src.domain.exceptions import ValidationException
from src.domain.repositories import IUserRepository
from src.domain.value_objects import Email, Password


class IPasswordVerifier(Protocol):
    """Protocol for password verification service."""

    def verify_password(self, password: str, password_hash: str) -> bool:
        """Verify a password against a hash."""
        ...


class LoginUser:
    """Use case for user login."""

    def __init__(
        self,
        user_repository: IUserRepository,
        password_verifier: IPasswordVerifier,
    ):
        """Initialize use case.

        Args:
            user_repository: Repository for user persistence
            password_verifier: Service for password verification
        """
        self._repository = user_repository
        self._password_verifier = password_verifier
        self._mapper = UserMapper()

    async def execute(self, dto: UserLoginDTO) -> UserResponseDTO | None:
        """Login a user.

        Args:
            dto: User login data

        Returns:
            UserResponseDTO if login successful, None otherwise

        Raises:
            ValidationException: If credentials are invalid
        """
        # Find user by email
        email = Email(dto.email)
        user = await self._repository.find_by_email(email)
        if not user:
            raise ValidationException("Invalid email or password")

        # Verify password
        password = Password(dto.password)
        is_valid = self._password_verifier.verify_password(
            password.value, user.password_hash
        )
        if not is_valid:
            raise ValidationException("Invalid email or password")

        # Return user
        return self._mapper.to_response_dto(user)
