"""Guide title value object."""

from dataclasses import dataclass

from ..exceptions import ValidationException


@dataclass(frozen=True)
class GuideTitle:
    """Guide title value object.

    Immutable guide title with validation.
    Ensures title is not empty.
    """

    value: str

    def __post_init__(self):
        """Validate guide title."""
        if not self.value or not isinstance(self.value, str):
            raise ValidationException("Guide title cannot be empty")

        if not self.value.strip():
            raise ValidationException("Guide title cannot be blank")

    def __str__(self) -> str:
        """Return string representation."""
        return self.value
