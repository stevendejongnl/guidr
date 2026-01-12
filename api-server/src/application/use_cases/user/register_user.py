"""Register user use case."""

from typing import Protocol
from uuid import uuid4

from src.application.dtos import UserCreateDTO, UserResponseDTO
from src.application.mappers import UserMapper
from src.domain.entities import User
from src.domain.events import UserPromotedToAdmin, UserRegistered
from src.domain.exceptions import ValidationException
from src.domain.repositories import IUserRepository
from src.domain.services import EventPersistenceService
from src.domain.value_objects import Email, EntityId, Password, Role, RoleType


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
        event_persistence_service: EventPersistenceService,
    ):
        """Initialize use case.

        Args:
            user_repository: Repository for user persistence
            password_hasher: Service for password hashing
            event_persistence_service: Service for persisting domain events
        """
        self._repository = user_repository
        self._password_hasher = password_hasher
        self._event_persistence = event_persistence_service
        self._mapper = UserMapper()

    async def execute(self, dto: UserCreateDTO) -> UserResponseDTO:
        """Register a new user.

        First user is automatically promoted to admin.

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

        # Check if this is the first user
        all_users = await self._repository.find_all()
        is_first_user = len(all_users) == 0

        # Determine role: first user = admin, others = user
        role = Role(RoleType.ADMIN if is_first_user else RoleType.USER)

        # Create entity with role
        user = User(
            id=EntityId(str(uuid4())),
            email=email,
            password_hash=password_hash,
            role=role,
        )

        # Save user
        await self._repository.save(user)

        # Persist UserRegistered event
        registered_event = UserRegistered(
            user_id=user.id.value,
            email=user.email.value,
        )
        await self._event_persistence.persist_event(
            registered_event,
            user_id=user.id.value,
        )

        # If first user, persist auto-promotion event
        if is_first_user:
            promotion_event = UserPromotedToAdmin(
                user_id=user.id.value,
                email=user.email.value,
                promoted_by_user_id=None,  # Auto-promotion
                reason="First registered user",
            )
            await self._event_persistence.persist_event(
                promotion_event,
                user_id=None,  # System action
            )

        return self._mapper.to_response_dto(user)
