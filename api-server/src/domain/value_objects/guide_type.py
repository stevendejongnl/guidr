"""GuideType value object for predefined guide types."""

from enum import Enum
from typing import Any


class GuideType(str, Enum):
    """Predefined guide types."""

    COOKING = "cooking"
    WORKOUT = "workout"
    GENERAL = "general"


METADATA_SCHEMAS: dict[GuideType, dict[str, type]] = {
    GuideType.COOKING: {
        "ingredients": list,
    },
    GuideType.WORKOUT: {
        "target_muscles": list,
        "equipment": list,
    },
    GuideType.GENERAL: {},
}


def validate_metadata(
    guide_type: GuideType,
    metadata: dict[str, Any] | None,
) -> None:
    """Validate metadata against the schema for a guide type.

    Args:
        guide_type: The guide type to validate against
        metadata: The metadata to validate (None is always valid)

    Raises:
        ValueError: If metadata contains invalid keys or types
    """
    if metadata is None:
        return

    schema = METADATA_SCHEMAS[guide_type]

    if not schema and metadata:
        raise ValueError(
            f"Guide type '{guide_type.value}' does not "
            f"support metadata"
        )

    for key, value in metadata.items():
        if key not in schema:
            allowed = list(schema.keys())
            raise ValueError(
                f"Invalid metadata key '{key}' for guide "
                f"type '{guide_type.value}'. "
                f"Allowed keys: {allowed}"
            )
        expected_type = schema[key]
        if not isinstance(value, expected_type):
            raise ValueError(
                f"Metadata key '{key}' must be "
                f"{expected_type.__name__}, "
                f"got {type(value).__name__}"
            )
