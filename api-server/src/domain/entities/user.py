"""User domain entity."""

from datetime import UTC, datetime

from ..exceptions import ValidationException
from ..value_objects import Email, EntityId, Role, RoleType


class User:
    """User entity for authentication and authorization."""

    def __init__(
        self,
        id: EntityId,
        email: Email,
        password_hash: str,
        created_at: datetime | None = None,
        updated_at: datetime | None = None,
        name: str | None = None,
        interests: list[str] | None = None,
        preferred_languages: list[str] | None = None,
        role: Role | None = None,
        is_admin: bool = False,
        is_beta: bool = False,
        refresh_token_hash: str | None = None,
        deleted_at: datetime | None = None,
    ):
        """Initialize a User.

        Args:
            id: Unique identifier
            email: User email (validated)
            password_hash: Hashed password (Argon2)
            created_at: Optional creation timestamp (defaults to now)
            updated_at: Optional update timestamp (defaults to now)
            name: Optional display name
            interests: Optional list of interest categories (defaults to empty list)
            preferred_languages: Optional list of preferred language codes (defaults to ["en"])
            role: User role (defaults to USER if not provided). Preferred over is_admin.
            is_admin: DEPRECATED - use role instead. Kept for backward compatibility.
            refresh_token_hash: Optional hashed refresh token for token rotation
            deleted_at: Optional soft-delete timestamp

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
        self._name = name
        self._interests = interests if interests is not None else []
        self._preferred_languages = (
            preferred_languages if preferred_languages is not None else ["en"]
        )

        # Role migration logic: prefer role, fall back to is_admin
        if role is None:
            role = Role(RoleType.ADMIN if is_admin else RoleType.USER)

        self._role = role
        self._is_beta = is_beta
        self._refresh_token_hash = refresh_token_hash
        self._deleted_at = deleted_at

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

    @property
    def name(self) -> str | None:
        """Get user display name."""
        return self._name

    @property
    def interests(self) -> list[str]:
        """Get user interests (returns copy to prevent external modification)."""
        return self._interests.copy()

    @property
    def role(self) -> Role:
        """Get user role."""
        return self._role

    @property
    def is_admin(self) -> bool:
        """Get admin status (derived from role for backward compatibility)."""
        return self._role.is_admin()

    @property
    def is_beta(self) -> bool:
        """Get beta program status."""
        return self._is_beta

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

    def update_name(self, new_name: str | None) -> None:
        """Update user display name.

        Args:
            new_name: New display name (can be None to clear name)
        """
        self._name = new_name
        self._updated_at = datetime.now(UTC)

    def update_email(self, new_email: Email) -> None:
        """Update user email.

        Args:
            new_email: New email address (validated)
        """
        self._email = new_email
        self._updated_at = datetime.now(UTC)

    @property
    def preferred_languages(self) -> list[str]:
        """Get preferred languages (returns copy)."""
        return self._preferred_languages.copy()

    def set_interests(self, interests: list[str]) -> None:
        """Set user interests (replaces entire list).

        Args:
            interests: List of interest category IDs
        """
        self._interests = interests.copy()
        self._updated_at = datetime.now(UTC)

    def set_preferred_languages(self, languages: list[str]) -> None:
        """Set preferred languages (replaces entire list).

        Args:
            languages: List of ISO 639-1 language codes
        """
        self._preferred_languages = languages.copy()
        self._updated_at = datetime.now(UTC)

    def set_role(self, role: Role) -> None:
        """Set user role.

        Args:
            role: New role for the user
        """
        self._role = role
        self._updated_at = datetime.now(UTC)

    def set_beta(self, is_beta: bool) -> None:
        """Set beta program status.

        Args:
            is_beta: Whether user should be in the beta program
        """
        self._is_beta = is_beta
        self._updated_at = datetime.now(UTC)

    @property
    def refresh_token_hash(self) -> str | None:
        """Get refresh token hash."""
        return self._refresh_token_hash

    @property
    def deleted_at(self) -> datetime | None:
        """Get soft-delete timestamp."""
        return self._deleted_at

    @property
    def is_deleted(self) -> bool:
        """Check if user is soft-deleted."""
        return self._deleted_at is not None

    def soft_delete(self) -> None:
        """Soft-delete this user by setting deleted_at timestamp."""
        self._deleted_at = datetime.now(UTC)
        self._updated_at = datetime.now(UTC)

    def update_refresh_token_hash(self, hash: str | None) -> None:
        """Update refresh token hash.

        Args:
            hash: New hashed refresh token, or None to clear
        """
        self._refresh_token_hash = hash
        self._updated_at = datetime.now(UTC)
