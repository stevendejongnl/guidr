"""Entity ID value object."""

from dataclasses import dataclass
from uuid import UUID
from ..exceptions import ValidationException


@dataclass(frozen=True)
class EntityId:
    """Entity ID value object (UUID).

    Immutable identifier for domain entities.
    Validates that the value is a valid UUID string.
    """

    value: str

    def __post_init__(self):
        """Validate that value is a valid UUID."""
        try:
            UUID(self.value)
        except (ValueError, AttributeError, TypeError):
            raise ValidationException(f"Invalid UUID format: {self.value}")

    def __str__(self) -> str:
        """Return string representation."""
        return self.value

    def __eq__(self, other: object) -> bool:
        """Check equality based on value."""
        if isinstance(other, EntityId):
            return self.value == other.value
        return False

    def __hash__(self) -> int:
        """Return hash based on value."""
        return hash(self.value)
