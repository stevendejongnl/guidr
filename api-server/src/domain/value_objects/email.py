"""Email value object."""

import re
from dataclasses import dataclass

from ..exceptions import ValidationException


@dataclass(frozen=True)
class Email:
    """Email value object.

    Immutable email address with validation.
    Ensures the email format is valid.
    """

    value: str

    def __post_init__(self):
        """Validate email format."""
        if not self._is_valid(self.value):
            raise ValidationException(f"Invalid email format: {self.value}")

    @staticmethod
    def _is_valid(email: str) -> bool:
        """Check if email format is valid."""
        if not email or not isinstance(email, str):
            return False

        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))

    def __str__(self) -> str:
        """Return string representation."""
        return self.value
