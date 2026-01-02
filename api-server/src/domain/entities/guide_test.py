import pytest
from datetime import datetime
from src.domain.entities import Guide
from src.domain.value_objects import EntityId, GuideTitle
from src.domain.exceptions import ValidationException


class TestGuide:
    """Test Guide entity."""

    def test_create_guide(self):
        """Should create guide with valid parameters."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        category_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        title = GuideTitle("Perfect Pasta")

        guide = Guide(id=id, category_id=category_id, title=title)

        assert guide.id == id
        assert guide.category_id == category_id
        assert guide.title == title
        assert guide.description is None
        assert guide.step_ids == []
        assert guide.step_count == 0
        assert isinstance(guide.created_at, datetime)
        assert isinstance(guide.updated_at, datetime)

    def test_create_guide_with_description(self):
        """Should create guide with optional description."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        category_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        title = GuideTitle("Perfect Pasta")
        description = "Learn to make authentic Italian pasta"

        guide = Guide(
            id=id,
            category_id=category_id,
            title=title,
            description=description
        )

        assert guide.description == description

    def test_create_guide_with_step_ids(self):
        """Should create guide with initial step IDs."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        category_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        title = GuideTitle("Perfect Pasta")
        step_id1 = EntityId("550e8400-e29b-41d4-a716-446655440002")
        step_id2 = EntityId("550e8400-e29b-41d4-a716-446655440003")

        guide = Guide(
            id=id,
            category_id=category_id,
            title=title,
            step_ids=[step_id1, step_id2]
        )

        assert guide.step_count == 2
        assert step_id1 in guide.step_ids
        assert step_id2 in guide.step_ids

    def test_step_ids_returns_immutable_copy(self):
        """Should return immutable copy of step_ids."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        category_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        title = GuideTitle("Perfect Pasta")
        guide = Guide(id=id, category_id=category_id, title=title)

        step_ids = guide.step_ids
        step_id = EntityId("550e8400-e29b-41d4-a716-446655440002")
        step_ids.append(step_id)

        # Original guide should be unchanged
        assert guide.step_count == 0
        assert step_id not in guide.step_ids

    def test_update_title(self):
        """Should update guide title and timestamp."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        category_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        title = GuideTitle("Original Title")
        guide = Guide(id=id, category_id=category_id, title=title)
        original_updated = guide.updated_at

        new_title = GuideTitle("New Title")
        guide.update_title(new_title)

        assert guide.title == new_title
        assert guide.updated_at > original_updated

    def test_update_description(self):
        """Should update guide description and timestamp."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        category_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        title = GuideTitle("Perfect Pasta")
        guide = Guide(id=id, category_id=category_id, title=title)
        original_updated = guide.updated_at

        guide.update_description("New description")

        assert guide.description == "New description"
        assert guide.updated_at > original_updated

    def test_add_step(self):
        """Should add step to guide."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        category_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        title = GuideTitle("Perfect Pasta")
        guide = Guide(id=id, category_id=category_id, title=title)

        step_id = EntityId("550e8400-e29b-41d4-a716-446655440002")
        guide.add_step(step_id)

        assert guide.step_count == 1
        assert step_id in guide.step_ids

    def test_add_duplicate_step(self):
        """Should not add duplicate step."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        category_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        title = GuideTitle("Perfect Pasta")
        guide = Guide(id=id, category_id=category_id, title=title)

        step_id = EntityId("550e8400-e29b-41d4-a716-446655440002")
        guide.add_step(step_id)
        guide.add_step(step_id)  # Add same step again

        assert guide.step_count == 1

    def test_add_multiple_steps(self):
        """Should add multiple steps to guide."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        category_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        title = GuideTitle("Perfect Pasta")
        guide = Guide(id=id, category_id=category_id, title=title)

        step_id1 = EntityId("550e8400-e29b-41d4-a716-446655440002")
        step_id2 = EntityId("550e8400-e29b-41d4-a716-446655440003")
        step_id3 = EntityId("550e8400-e29b-41d4-a716-446655440004")

        guide.add_step(step_id1)
        guide.add_step(step_id2)
        guide.add_step(step_id3)

        assert guide.step_count == 3

    def test_remove_step(self):
        """Should remove step from guide."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        category_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        title = GuideTitle("Perfect Pasta")
        step_id = EntityId("550e8400-e29b-41d4-a716-446655440002")
        guide = Guide(id=id, category_id=category_id, title=title, step_ids=[step_id])

        guide.remove_step(step_id)

        assert guide.step_count == 0
        assert step_id not in guide.step_ids

    def test_remove_nonexistent_step(self):
        """Should not raise error when removing nonexistent step."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        category_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        title = GuideTitle("Perfect Pasta")
        guide = Guide(id=id, category_id=category_id, title=title)

        step_id = EntityId("550e8400-e29b-41d4-a716-446655440002")
        guide.remove_step(step_id)  # Should not raise

        assert guide.step_count == 0

    def test_add_step_updates_timestamp(self):
        """Should update timestamp when adding step."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        category_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        title = GuideTitle("Perfect Pasta")
        guide = Guide(id=id, category_id=category_id, title=title)
        original_updated = guide.updated_at

        step_id = EntityId("550e8400-e29b-41d4-a716-446655440002")
        guide.add_step(step_id)

        assert guide.updated_at > original_updated

    def test_remove_step_updates_timestamp(self):
        """Should update timestamp when removing step."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        category_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        title = GuideTitle("Perfect Pasta")
        step_id = EntityId("550e8400-e29b-41d4-a716-446655440002")
        guide = Guide(id=id, category_id=category_id, title=title, step_ids=[step_id])
        original_updated = guide.updated_at

        guide.remove_step(step_id)

        assert guide.updated_at > original_updated

    def test_immutable_properties(self):
        """Should have immutable id, category_id, created_at."""
        id = EntityId("550e8400-e29b-41d4-a716-446655440000")
        category_id = EntityId("550e8400-e29b-41d4-a716-446655440001")
        title = GuideTitle("Perfect Pasta")
        guide = Guide(id=id, category_id=category_id, title=title)

        with pytest.raises(AttributeError):
            guide.id = EntityId("550e8400-e29b-41d4-a716-446655440002")

        with pytest.raises(AttributeError):
            guide.category_id = EntityId("550e8400-e29b-41d4-a716-446655440003")

        with pytest.raises(AttributeError):
            guide.created_at = datetime.utcnow()
