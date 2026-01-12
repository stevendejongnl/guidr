"""Role value object for RBAC."""

from enum import Enum


class RoleType(str, Enum):
    """User role types."""

    USER = "user"
    ADMIN = "admin"

class Role:
    """Role value object with validation."""

    def __init__(self, role: RoleType | str):
        """Initialize role.

        Args:
            role: Role type (enum or string)

        Raises:
            ValueError: If role is invalid
        """
        if isinstance(role, str):
            try:
                role = RoleType(role.lower())
            except ValueError:
                raise ValueError(
                    f"Invalid role: {role}. Must be one of: {[r.value for r in RoleType]}"
                )

        self._role = role

    @property
    def value(self) -> str:
        """Get role string value."""
        return self._role.value

    @property
    def type(self) -> RoleType:
        """Get role type enum."""
        return self._role

    def is_admin(self) -> bool:
        """Check if role is admin."""
        return self._role == RoleType.ADMIN

    def __eq__(self, other: object) -> bool:
        """Compare roles."""
        if not isinstance(other, Role):
            return False
        return self._role == other._role

    def __str__(self) -> str:
        """String representation."""
        return self._role.value

    def __repr__(self) -> str:
        """Repr for debugging."""
        return f"Role({self._role.value})"
