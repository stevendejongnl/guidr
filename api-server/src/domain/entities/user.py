"""User domain entity."""

from datetime import UTC, datetime

from ..exceptions import ValidationException
from ..value_objects import Email, EntityId


class User:
    """User entity for authentication and authorization."""

    def __init__(
        self,
        id: EntityId,
        email: Email,
        password_hash: str,
        created_at: datetime | None = None,
        updated_at: datetime | None = None,
    ):
        """Initialize a User.

        Args:
            id: Unique identifier
            email: User email (validated)
            password_hash: Hashed password (Argon2)
            created_at: Optional creation timestamp (defaults to now)
            updated_at: Optional update timestamp (defaults to now)

        Raises:
            ValidationException: If password_hash is empty
        """
        if not password_hash or not password_hash.strip():
            raise ValidationException("Password hash cannot be empty")

        self._id = id
        self._email = email
        self._password_hash = password_hash
        self._created_at = created_at or datetime.now(UTC)
        self._updated_at = updated_at or datetime.now(UTC)

    @property
    def id(self) -> EntityId:
        """Get entity ID."""
        return self._id

    @property
    def email(self) -> Email:
        """Get user email."""
        return self._email

    @property
    def password_hash(self) -> str:
        """Get password hash."""
        return self._password_hash

    @property
    def created_at(self) -> datetime:
        """Get creation timestamp."""
        return self._created_at

    @property
    def updated_at(self) -> datetime:
        """Get last update timestamp."""
        return self._updated_at

    def update_password_hash(self, new_password_hash: str) -> None:
        """Update password hash.

        Args:
            new_password_hash: New hashed password

        Raises:
            ValidationException: If new_password_hash is empty
        """
        if not new_password_hash or not new_password_hash.strip():
            raise ValidationException("Password hash cannot be empty")

        self._password_hash = new_password_hash
        self._updated_at = datetime.now(UTC)
