"""Register user use case."""

from typing import Protocol
from uuid import uuid4

from src.application.dtos import UserCreateDTO, UserResponseDTO
from src.application.mappers import UserMapper
from src.domain.entities import User
from src.domain.exceptions import ValidationException
from src.domain.repositories import IUserRepository
from src.domain.value_objects import Email, EntityId, Password


class IPasswordHasher(Protocol):
    """Protocol for password hashing service."""

    def hash_password(self, password: str) -> str:
        """Hash a password."""
        ...


class RegisterUser:
    """Use case for registering a new user."""

    def __init__(
        self,
        user_repository: IUserRepository,
        password_hasher: IPasswordHasher,
    ):
        """Initialize use case.

        Args:
            user_repository: Repository for user persistence
            password_hasher: Service for password hashing
        """
        self._repository = user_repository
        self._password_hasher = password_hasher
        self._mapper = UserMapper()

    async def execute(self, dto: UserCreateDTO) -> UserResponseDTO:
        """Register a new user.

        Args:
            dto: User creation data

        Returns:
            UserResponseDTO with created user data

        Raises:
            ValidationException: If email already exists
        """
        # Validate email doesn't exist
        email = Email(dto.email)
        existing_user = await self._repository.find_by_email(email)
        if existing_user:
            raise ValidationException(f"Email already exists: {dto.email}")

        # Hash password
        password = Password(dto.password)
        password_hash = self._password_hasher.hash_password(password.value)

        # Create entity
        user = User(
            id=EntityId(str(uuid4())),
            email=email,
            password_hash=password_hash,
        )

        # Save and return
        await self._repository.save(user)
        return self._mapper.to_response_dto(user)
