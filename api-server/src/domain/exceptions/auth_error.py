"""Authentication exception."""

from .base import BaseDomainException


class AuthenticationException(BaseDomainException):
    """Raised when authentication fails."""

    pass
