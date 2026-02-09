from datetime import UTC, datetime

import pytest

from src.domain.entities import Guide
from src.domain.value_objects import EntityId, GuideTitle, GuideType

TEST_ID = "550e8400-e29b-41d4-a716-446655440000"
TEST_STEP1 = "550e8400-e29b-41d4-a716-446655440002"
TEST_STEP2 = "550e8400-e29b-41d4-a716-446655440003"
TEST_STEP3 = "550e8400-e29b-41d4-a716-446655440004"


def _make_guide(**overrides):
    defaults = {
        "id": EntityId(TEST_ID),
        "guide_type": GuideType.COOKING,
        "title": GuideTitle("Perfect Pasta"),
    }
    defaults.update(overrides)
    return Guide(**defaults)


class TestGuide:
    """Test Guide entity."""

    def test_create_guide(self):
        guide = _make_guide()

        assert guide.id == EntityId(TEST_ID)
        assert guide.guide_type == GuideType.COOKING
        assert guide.title == GuideTitle("Perfect Pasta")
        assert guide.description is None
        assert guide.metadata is None
        assert guide.step_ids == []
        assert guide.step_count == 0
        assert isinstance(guide.created_at, datetime)
        assert isinstance(guide.updated_at, datetime)

    def test_create_guide_with_description(self):
        guide = _make_guide(
            description="Learn to make authentic Italian pasta"
        )
        assert (
            guide.description
            == "Learn to make authentic Italian pasta"
        )

    def test_create_guide_with_metadata(self):
        metadata = {"ingredients": ["flour", "eggs"]}
        guide = _make_guide(metadata=metadata)
        assert guide.metadata == metadata

    def test_create_guide_invalid_metadata_raises(self):
        with pytest.raises(ValueError):
            _make_guide(metadata={"invalid_key": "value"})

    def test_create_guide_with_step_ids(self):
        step_id1 = EntityId(TEST_STEP1)
        step_id2 = EntityId(TEST_STEP2)
        guide = _make_guide(step_ids=[step_id1, step_id2])

        assert guide.step_count == 2
        assert step_id1 in guide.step_ids
        assert step_id2 in guide.step_ids

    def test_step_ids_returns_immutable_copy(self):
        guide = _make_guide()
        step_ids = guide.step_ids
        step_ids.append(EntityId(TEST_STEP1))
        assert guide.step_count == 0

    def test_update_title(self):
        guide = _make_guide()
        original_updated = guide.updated_at

        new_title = GuideTitle("New Title")
        guide.update_title(new_title)

        assert guide.title == new_title
        assert guide.updated_at > original_updated

    def test_update_description(self):
        guide = _make_guide()
        original_updated = guide.updated_at

        guide.update_description("New description")

        assert guide.description == "New description"
        assert guide.updated_at > original_updated

    def test_update_metadata(self):
        guide = _make_guide()
        original_updated = guide.updated_at

        new_metadata = {"ingredients": ["butter"]}
        guide.update_metadata(new_metadata)

        assert guide.metadata == new_metadata
        assert guide.updated_at > original_updated

    def test_update_metadata_invalid_raises(self):
        guide = _make_guide()
        with pytest.raises(ValueError):
            guide.update_metadata({"bad_key": "value"})

    def test_add_step(self):
        guide = _make_guide()
        step_id = EntityId(TEST_STEP1)
        guide.add_step(step_id)

        assert guide.step_count == 1
        assert step_id in guide.step_ids

    def test_add_duplicate_step(self):
        guide = _make_guide()
        step_id = EntityId(TEST_STEP1)
        guide.add_step(step_id)
        guide.add_step(step_id)
        assert guide.step_count == 1

    def test_add_multiple_steps(self):
        guide = _make_guide()
        guide.add_step(EntityId(TEST_STEP1))
        guide.add_step(EntityId(TEST_STEP2))
        guide.add_step(EntityId(TEST_STEP3))
        assert guide.step_count == 3

    def test_remove_step(self):
        step_id = EntityId(TEST_STEP1)
        guide = _make_guide(step_ids=[step_id])
        guide.remove_step(step_id)

        assert guide.step_count == 0
        assert step_id not in guide.step_ids

    def test_remove_nonexistent_step(self):
        guide = _make_guide()
        guide.remove_step(EntityId(TEST_STEP1))
        assert guide.step_count == 0

    def test_add_step_updates_timestamp(self):
        guide = _make_guide()
        original_updated = guide.updated_at
        guide.add_step(EntityId(TEST_STEP1))
        assert guide.updated_at > original_updated

    def test_remove_step_updates_timestamp(self):
        step_id = EntityId(TEST_STEP1)
        guide = _make_guide(step_ids=[step_id])
        original_updated = guide.updated_at
        guide.remove_step(step_id)
        assert guide.updated_at > original_updated

    def test_immutable_properties(self):
        guide = _make_guide()

        with pytest.raises(AttributeError):
            guide.id = EntityId(TEST_STEP1)

        with pytest.raises(AttributeError):
            guide.guide_type = GuideType.GENERAL

        with pytest.raises(AttributeError):
            guide.created_at = datetime.now(UTC)

    def test_all_guide_types(self):
        for gt in GuideType:
            guide = _make_guide(guide_type=gt)
            assert guide.guide_type == gt

    def test_workout_with_metadata(self):
        metadata = {
            "target_muscles": ["chest"],
            "equipment": ["dumbbells"],
        }
        guide = _make_guide(
            guide_type=GuideType.WORKOUT,
            metadata=metadata,
        )
        assert guide.metadata == metadata

    def test_general_no_metadata(self):
        guide = _make_guide(
            guide_type=GuideType.GENERAL,
            metadata=None,
        )
        assert guide.metadata is None

    def test_make_public(self):
        guide = _make_guide()
        guide.make_public()
        assert guide.is_public is True

    def test_make_private(self):
        guide = _make_guide(is_public=True)
        guide.make_private()
        assert guide.is_public is False

    def test_highlight(self):
        guide = _make_guide()
        guide.highlight()
        assert guide.is_highlighted is True

    def test_unhighlight(self):
        guide = _make_guide(is_highlighted=True)
        guide.unhighlight()
        assert guide.is_highlighted is False
