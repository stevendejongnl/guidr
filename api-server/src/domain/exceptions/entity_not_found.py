"""Entity not found exception."""

from .base import BaseDomainException


class EntityNotFoundException(BaseDomainException):
    """Raised when an entity is not found."""

    pass
