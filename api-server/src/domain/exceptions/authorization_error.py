"""Authorization exception."""

from .base import BaseDomainException


class AuthorizationException(BaseDomainException):
    """Raised when user lacks required authorization/privileges."""

    pass
