"""GuideType value object for predefined guide types."""

from enum import Enum
from typing import Any


class GuideType(str, Enum):
    """Predefined guide types."""

    COOKING = "cooking"
    WORKOUT = "workout"
    GENERAL = "general"


INGREDIENT_REQUIRED_KEYS = {"name", "quantity", "unit"}


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


def validate_ingredient_items(items: list[Any]) -> None:
    """Validate that ingredient list items are structured objects.

    Each item must be a dict with keys: name, quantity, unit (all strings).

    Args:
        items: The list of ingredient items to validate

    Raises:
        ValueError: If any item is not a valid ingredient object
    """
    for i, item in enumerate(items):
        if not isinstance(item, dict):
            raise ValueError(
                f"Ingredient at index {i} must be an object, "
                f"got {type(item).__name__}"
            )
        missing = INGREDIENT_REQUIRED_KEYS - set(item.keys())
        if missing:
            raise ValueError(
                f"Ingredient at index {i} missing keys: "
                f"{sorted(missing)}"
            )
        extra = set(item.keys()) - INGREDIENT_REQUIRED_KEYS
        if extra:
            raise ValueError(
                f"Ingredient at index {i} has unexpected keys: "
                f"{sorted(extra)}"
            )
        for key in INGREDIENT_REQUIRED_KEYS:
            if not isinstance(item[key], str):
                raise ValueError(
                    f"Ingredient at index {i} key '{key}' "
                    f"must be str, got {type(item[key]).__name__}"
                )


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
        if key == "ingredients" and isinstance(value, list):
            validate_ingredient_items(value)
