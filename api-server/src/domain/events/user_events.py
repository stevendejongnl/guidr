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
