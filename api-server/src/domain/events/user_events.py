"""User domain events."""

from dataclasses import dataclass

from .base import BaseDomainEvent


@dataclass(frozen=True)
class UserRegistered(BaseDomainEvent):
    """Event raised when a user registers."""

    user_id: str
    email: str


@dataclass(frozen=True)
class UserLoggedIn(BaseDomainEvent):
    """Event raised when a user logs in."""

    user_id: str
    email: str


@dataclass(frozen=True)
class UserPasswordChanged(BaseDomainEvent):
    """Event raised when a user changes their password."""

    user_id: str


@dataclass(frozen=True)
class UserEmailChanged(BaseDomainEvent):
    """Event raised when a user changes their email."""

    user_id: str
    old_email: str
    new_email: str


@dataclass(frozen=True)
class UserProfileUpdated(BaseDomainEvent):
    """Event raised when a user updates their profile (name or interests)."""

    user_id: str


@dataclass(frozen=True)
class UserDeleted(BaseDomainEvent):
    """Event raised when a user account is deleted."""

    user_id: str
    email: str


@dataclass(frozen=True)
class UserRoleChanged(BaseDomainEvent):
    """Event raised when a user's role changes."""

    user_id: str
    old_role: str
    new_role: str
    changed_by_user_id: str


@dataclass(frozen=True)
class UserPromotedToAdmin(BaseDomainEvent):
    """Event raised when a user is promoted to admin (convenience event)."""

    user_id: str
    email: str
    promoted_by_user_id: str | None  # None = auto-promotion (first user)
    reason: str | None = None  # Optional reason for audit
