"""Step duration value object."""

from dataclasses import dataclass

from ..exceptions import ValidationException


@dataclass(frozen=True)
class StepDuration:
    """Step duration value object.

    Immutable step duration in seconds.
    Ensures duration is a positive integer.
    """

    value: int

    def __post_init__(self):
        """Validate step duration."""
        if not isinstance(self.value, int):
            raise ValidationException("Step duration must be an integer")

        if self.value <= 0:
            raise ValidationException("Step duration must be positive")

    def __str__(self) -> str:
        """Return string representation."""
        return str(self.value)

    def __int__(self) -> int:
        """Return integer value."""
        return self.value
