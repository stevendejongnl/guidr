"""Authorization helpers for use cases."""

from src.domain.entities import Guide, User
from src.domain.exceptions import AuthorizationException
from src.domain.value_objects import EntityId


def require_admin(user: User) -> None:
    """Verify user has admin privileges.

    Args:
        user: User to check

    Raises:
        AuthorizationException: If user is not an admin
    """
    if not user.is_admin:
        raise AuthorizationException("Admin privileges required")


def require_owner_or_admin(user: User, resource_user_id: EntityId | None) -> None:
    """Verify user is owner of resource or has admin privileges.

    Args:
        user: User to check
        resource_user_id: ID of user who owns the resource

    Raises:
        AuthorizationException: If user is neither owner nor admin
    """
    if user.is_admin:
        return

    if resource_user_id is None:
        raise AuthorizationException("You are not authorized to access this resource")

    if user.id != resource_user_id:
        raise AuthorizationException("You are not authorized to access this resource")


def can_view_guide(user: User | None, guide: Guide) -> bool:
    """Check if a user can view a guide.

    Args:
        user: User to check (None for unauthenticated)
        guide: Guide to check access for

    Returns:
        True if user can view the guide, False otherwise
    """
    # Admins can always view
    if user is not None and user.is_admin:
        return True

    # Public guides are always viewable
    if guide.is_public:
        return True

    # Private guides: only creator or admins can view
    if user is None:
        return False

    if guide.created_by_user_id is None:
        # Legacy guide without owner - treat as admin-only
        return user.is_admin

    return user.id == guide.created_by_user_id


__all__ = ["require_admin", "require_owner_or_admin", "can_view_guide"]
