import pytest

from src.domain.value_objects.guide_type import (
    METADATA_SCHEMAS,
    GuideType,
    validate_ingredient_items,
    validate_metadata,
)


class TestGuideType:
    """Test GuideType enum."""

    def test_cooking_value(self):
        assert GuideType.COOKING.value == "cooking"

    def test_workout_value(self):
        assert GuideType.WORKOUT.value == "workout"

    def test_general_value(self):
        assert GuideType.GENERAL.value == "general"

    def test_create_from_string(self):
        assert GuideType("cooking") == GuideType.COOKING

    def test_invalid_string_raises(self):
        with pytest.raises(ValueError):
            GuideType("invalid")

    def test_is_string_subclass(self):
        assert isinstance(GuideType.COOKING, str)

    def test_all_types_have_schemas(self):
        for guide_type in GuideType:
            assert guide_type in METADATA_SCHEMAS


class TestValidateMetadata:
    """Test metadata validation."""

    def test_none_metadata_always_valid(self):
        for guide_type in GuideType:
            validate_metadata(guide_type, None)

    def test_cooking_valid_ingredients(self):
        validate_metadata(
            GuideType.COOKING,
            {"ingredients": [
                {"name": "flour", "quantity": "200", "unit": "g"},
                {"name": "sugar", "quantity": "100", "unit": "g"},
            ]},
        )

    def test_cooking_empty_ingredients_list(self):
        validate_metadata(
            GuideType.COOKING,
            {"ingredients": []},
        )

    def test_cooking_invalid_key(self):
        with pytest.raises(ValueError, match="Invalid metadata key"):
            validate_metadata(
                GuideType.COOKING,
                {"unknown_key": "value"},
            )

    def test_cooking_invalid_type(self):
        with pytest.raises(ValueError, match="must be list"):
            validate_metadata(
                GuideType.COOKING,
                {"ingredients": "not a list"},
            )

    def test_workout_valid_metadata(self):
        validate_metadata(
            GuideType.WORKOUT,
            {
                "target_muscles": ["chest", "triceps"],
                "equipment": ["dumbbells"],
            },
        )

    def test_workout_partial_metadata(self):
        validate_metadata(
            GuideType.WORKOUT,
            {"target_muscles": ["legs"]},
        )

    def test_general_no_metadata_allowed(self):
        with pytest.raises(
            ValueError, match="does not support metadata"
        ):
            validate_metadata(
                GuideType.GENERAL,
                {"some_key": "value"},
            )

    def test_general_empty_dict_valid(self):
        validate_metadata(GuideType.GENERAL, {})


class TestValidateIngredientItems:
    """Test structured ingredient validation."""

    def test_valid_ingredient_objects(self):
        validate_ingredient_items([
            {"name": "flour", "quantity": "200", "unit": "g"},
            {"name": "eggs", "quantity": "2", "unit": "piece"},
        ])

    def test_empty_list_valid(self):
        validate_ingredient_items([])

    def test_non_dict_item_raises(self):
        with pytest.raises(ValueError, match="must be an object"):
            validate_ingredient_items(["flour"])

    def test_missing_keys_raises(self):
        with pytest.raises(ValueError, match="missing keys"):
            validate_ingredient_items([{"name": "flour"}])

    def test_extra_keys_raises(self):
        with pytest.raises(ValueError, match="unexpected keys"):
            validate_ingredient_items([
                {"name": "flour", "quantity": "200", "unit": "g", "notes": "sifted"},
            ])

    def test_non_string_value_raises(self):
        with pytest.raises(ValueError, match="must be str"):
            validate_ingredient_items([
                {"name": "flour", "quantity": 200, "unit": "g"},
            ])

    def test_ingredient_validation_through_metadata(self):
        with pytest.raises(ValueError, match="must be an object"):
            validate_metadata(
                GuideType.COOKING,
                {"ingredients": ["just a string"]},
            )
