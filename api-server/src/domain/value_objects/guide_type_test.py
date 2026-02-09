import pytest

from src.domain.value_objects.guide_type import (
    METADATA_SCHEMAS,
    GuideType,
    validate_equipment_items,
    validate_ingredient_items,
    validate_metadata,
    validate_muscle_items,
    validate_note_items,
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
                "target_muscles": [
                    {"name": "chest", "focus": "primary"},
                    {"name": "triceps", "focus": "secondary"},
                ],
                "equipment": [
                    {"name": "dumbbells", "weight": "15kg"},
                ],
            },
        )

    def test_workout_partial_metadata(self):
        validate_metadata(
            GuideType.WORKOUT,
            {"target_muscles": [
                {"name": "legs", "focus": "primary"},
            ]},
        )

    def test_general_invalid_key(self):
        with pytest.raises(
            ValueError, match="Invalid metadata key"
        ):
            validate_metadata(
                GuideType.GENERAL,
                {"some_key": "value"},
            )

    def test_general_empty_dict_valid(self):
        validate_metadata(GuideType.GENERAL, {})

    def test_general_valid_notes(self):
        validate_metadata(
            GuideType.GENERAL,
            {"notes": [
                {"key": "difficulty", "value": "beginner"},
            ]},
        )

    def test_general_empty_notes_list(self):
        validate_metadata(
            GuideType.GENERAL,
            {"notes": []},
        )


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


class TestValidateMuscleItems:
    """Test structured muscle validation."""

    def test_valid_muscle_objects(self):
        validate_muscle_items([
            {"name": "chest", "focus": "primary"},
            {"name": "triceps", "focus": "secondary"},
        ])

    def test_empty_list_valid(self):
        validate_muscle_items([])

    def test_non_dict_item_raises(self):
        with pytest.raises(
            ValueError, match="must be an object"
        ):
            validate_muscle_items(["chest"])

    def test_missing_keys_raises(self):
        with pytest.raises(ValueError, match="missing keys"):
            validate_muscle_items([{"name": "chest"}])

    def test_extra_keys_raises(self):
        with pytest.raises(
            ValueError, match="unexpected keys"
        ):
            validate_muscle_items([
                {
                    "name": "chest",
                    "focus": "primary",
                    "extra": "x",
                },
            ])

    def test_non_string_value_raises(self):
        with pytest.raises(ValueError, match="must be str"):
            validate_muscle_items([
                {"name": "chest", "focus": 1},
            ])

    def test_muscle_validation_through_metadata(self):
        with pytest.raises(
            ValueError, match="must be an object"
        ):
            validate_metadata(
                GuideType.WORKOUT,
                {"target_muscles": ["just a string"]},
            )


class TestValidateEquipmentItems:
    """Test structured equipment validation."""

    def test_valid_equipment_objects(self):
        validate_equipment_items([
            {"name": "dumbbells", "weight": "15kg"},
            {"name": "barbell", "weight": "20kg"},
        ])

    def test_empty_list_valid(self):
        validate_equipment_items([])

    def test_non_dict_item_raises(self):
        with pytest.raises(
            ValueError, match="must be an object"
        ):
            validate_equipment_items(["dumbbells"])

    def test_missing_keys_raises(self):
        with pytest.raises(ValueError, match="missing keys"):
            validate_equipment_items([
                {"name": "dumbbells"},
            ])

    def test_extra_keys_raises(self):
        with pytest.raises(
            ValueError, match="unexpected keys"
        ):
            validate_equipment_items([
                {
                    "name": "dumbbells",
                    "weight": "15kg",
                    "brand": "x",
                },
            ])

    def test_non_string_value_raises(self):
        with pytest.raises(ValueError, match="must be str"):
            validate_equipment_items([
                {"name": "dumbbells", "weight": 15},
            ])

    def test_equipment_validation_through_metadata(self):
        with pytest.raises(
            ValueError, match="must be an object"
        ):
            validate_metadata(
                GuideType.WORKOUT,
                {"equipment": ["just a string"]},
            )


class TestValidateNoteItems:
    """Test structured note validation."""

    def test_valid_note_objects(self):
        validate_note_items([
            {"key": "difficulty", "value": "beginner"},
            {"key": "duration", "value": "30min"},
        ])

    def test_empty_list_valid(self):
        validate_note_items([])

    def test_non_dict_item_raises(self):
        with pytest.raises(
            ValueError, match="must be an object"
        ):
            validate_note_items(["difficulty"])

    def test_missing_keys_raises(self):
        with pytest.raises(ValueError, match="missing keys"):
            validate_note_items([{"key": "difficulty"}])

    def test_extra_keys_raises(self):
        with pytest.raises(
            ValueError, match="unexpected keys"
        ):
            validate_note_items([
                {
                    "key": "difficulty",
                    "value": "beginner",
                    "extra": "x",
                },
            ])

    def test_non_string_value_raises(self):
        with pytest.raises(ValueError, match="must be str"):
            validate_note_items([
                {"key": "difficulty", "value": 1},
            ])

    def test_note_validation_through_metadata(self):
        with pytest.raises(
            ValueError, match="must be an object"
        ):
            validate_metadata(
                GuideType.GENERAL,
                {"notes": ["just a string"]},
            )
