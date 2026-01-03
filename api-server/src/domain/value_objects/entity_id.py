"""Entity ID value object."""

import re
from dataclasses import dataclass
from uuid import UUID
from ..exceptions import ValidationException

# MongoDB ObjectId pattern: 24 hexadecimal characters
OBJECT_ID_PATTERN = re.compile(r"^[a-fA-F0-9]{24}$")


def _is_valid_uuid(value: str) -> bool:
    """Check if value is a valid UUID string."""
    try:
        UUID(value)
        return True
    except (ValueError, AttributeError, TypeError):
        return False


def _is_valid_object_id(value: str) -> bool:
    """Check if value is a valid MongoDB ObjectId string."""
    return bool(OBJECT_ID_PATTERN.match(value))


@dataclass(frozen=True)
class EntityId:
    """Entity ID value object (UUID or MongoDB ObjectId).

    Immutable identifier for domain entities.
    Validates that the value is either a valid UUID string or MongoDB ObjectId.
    """

    value: str

    def __post_init__(self):
        """Validate that value is a valid UUID or MongoDB ObjectId."""
        if not isinstance(self.value, str):
            # Handle cases where value might be a native ObjectId type
            object.__setattr__(self, "value", str(self.value))

        if not _is_valid_uuid(self.value) and not _is_valid_object_id(self.value):
            raise ValidationException(
                f"Invalid entity ID format: {self.value}. "
                "Expected UUID or MongoDB ObjectId format."
            )

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
