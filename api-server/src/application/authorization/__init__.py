"""Authorization helpers for use cases."""

from src.domain.entities import User
from src.domain.exceptions import AuthorizationException


def require_admin(user: User) -> None:
    """Verify user has admin privileges.

    Args:
        user: User to check

    Raises:
        AuthorizationException: If user is not an admin
    """
    if not user.is_admin:
        raise AuthorizationException("Admin privileges required")


__all__ = ["require_admin"]
