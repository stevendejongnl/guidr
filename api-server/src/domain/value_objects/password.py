"""Password value object."""

from dataclasses import dataclass

from ..exceptions import ValidationException


@dataclass(frozen=True)
class Password:
    """Password value object (plain text, not hash).

    Immutable password with minimum length validation.
    Note: This is for plain text passwords before hashing.
    """

    value: str
    MIN_LENGTH = 6

    def __post_init__(self):
        """Validate password requirements."""
        if not self.value or not isinstance(self.value, str):
            raise ValidationException("Password cannot be empty")

        if len(self.value) < self.MIN_LENGTH:
            raise ValidationException(
                f"Password must be at least {self.MIN_LENGTH} characters"
            )

    def __str__(self) -> str:
        """Return masked representation for security."""
        return "********"

    def __repr__(self) -> str:
        """Return masked representation for security."""
        return "Password(value='********')"
