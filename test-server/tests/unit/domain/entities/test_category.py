import pytest
from datetime import datetime
from src.domain.entities import Category
from src.domain.value_objects import EntityId
from src.domain.exceptions import ValidationException


class TestCategory:
    """Test Category entity."""

    def test_create_category(self):
        """Should create category with valid parameters."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        category = Category(id=id, name="Cooking")

        assert category.id == id
        assert category.name == "Cooking"
        assert category.parent_id is None
        assert isinstance(category.created_at, datetime)
        assert isinstance(category.updated_at, datetime)
        assert category.is_root() is True

    def test_create_category_with_parent(self):
        """Should create category with parent ID."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        parent_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        category = Category(id=id, name="Italian", parent_id=parent_id)

        assert category.parent_id == parent_id
        assert category.is_root() is False

    def test_create_category_with_custom_timestamps(self):
        """Should create category with custom timestamps."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        created = datetime(2024, 1, 1, 12, 0, 0)
        updated = datetime(2024, 1, 2, 12, 0, 0)

        category = Category(
            id=id,
            name="Cooking",
            created_at=created,
            updated_at=updated
        )

        assert category.created_at == created
        assert category.updated_at == updated

    def test_create_category_with_empty_name(self):
        """Should raise ValidationException for empty name."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")

        with pytest.raises(ValidationException) as exc_info:
            Category(id=id, name="")

        assert "name cannot be empty" in str(exc_info.value)

    def test_create_category_with_blank_name(self):
        """Should raise ValidationException for blank name."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")

        with pytest.raises(ValidationException) as exc_info:
            Category(id=id, name="   ")

        assert "name cannot be empty" in str(exc_info.value)

    def test_update_name(self):
        """Should update category name and timestamp."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        category = Category(id=id, name="Original Name")
        original_updated = category.updated_at

        category.update_name("New Name")

        assert category.name == "New Name"
        assert category.updated_at > original_updated

    def test_update_name_with_empty_string(self):
        """Should raise ValidationException when updating with empty name."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        category = Category(id=id, name="Original Name")

        with pytest.raises(ValidationException) as exc_info:
            category.update_name("")

        assert "name cannot be empty" in str(exc_info.value)
        assert category.name == "Original Name"

    def test_update_name_with_blank_string(self):
        """Should raise ValidationException when updating with blank name."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        category = Category(id=id, name="Original Name")

        with pytest.raises(ValidationException) as exc_info:
            category.update_name("   ")

        assert "name cannot be empty" in str(exc_info.value)

    def test_is_root_for_root_category(self):
        """Should return True for root category."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        category = Category(id=id, name="Root", parent_id=None)

        assert category.is_root() is True

    def test_is_root_for_child_category(self):
        """Should return False for child category."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        parent_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        category = Category(id=id, name="Child", parent_id=parent_id)

        assert category.is_root() is False

    def test_immutable_id(self):
        """Should have immutable ID."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        category = Category(id=id, name="Cooking")

        # ID is readonly - cannot be changed
        with pytest.raises(AttributeError):
            category.id = EntityId("550e8400-e29b-41d4-a716-446655440001")

    def test_immutable_parent_id(self):
        """Should have immutable parent_id."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        parent_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        category = Category(id=id, name="Child", parent_id=parent_id)

        with pytest.raises(AttributeError):
            category.parent_id = EntityId("550e8400-e29b-41d4-a716-446655440002")

    def test_immutable_created_at(self):
        """Should have immutable created_at."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        category = Category(id=id, name="Cooking")

        with pytest.raises(AttributeError):
            category.created_at = datetime.utcnow()
