"""Domain exceptions."""

from .auth_error import AuthenticationException
from .authorization_error import AuthorizationException
from .base import BaseDomainException
from .entity_not_found import EntityNotFoundException
from .validation_error import ValidationException

__all__ = [
    "BaseDomainException",
    "ValidationException",
    "EntityNotFoundException",
    "AuthenticationException",
    "AuthorizationException",
]
