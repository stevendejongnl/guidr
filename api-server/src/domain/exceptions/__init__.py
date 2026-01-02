"""Domain exceptions."""

from .base import BaseDomainException
from .validation_error import ValidationException
from .entity_not_found import EntityNotFoundException
from .auth_error import AuthenticationException

__all__ = [
    "BaseDomainException",
    "ValidationException",
    "EntityNotFoundException",
    "AuthenticationException",
]
