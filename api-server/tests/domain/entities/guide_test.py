"""Tests for Guide entity."""

from datetime import UTC, datetime
from uuid import uuid4

import pytest

from src.domain.entities import Guide
from src.domain.value_objects import EntityId, GuideTitle, GuideType


class TestGuide:
    """Test suite for Guide entity."""

    def test_create_guide_with_minimal_fields(self) -> None:
        """Test creating a guide with only required fields."""
        guide_id = EntityId(str(uuid4()))
        title = GuideTitle("Learn Python")

        guide = Guide(
            id=guide_id,
            guide_type=GuideType.GENERAL,
            title=title,
        )

        assert guide.id == guide_id
        assert guide.guide_type == GuideType.GENERAL
        assert guide.title == title
        assert guide.description is None
        assert guide.metadata is None
        assert guide.step_ids == []
        assert guide.created_by_user_id is None
        assert guide.is_public is False
        assert guide.is_highlighted is False

    def test_create_guide_with_all_fields(self) -> None:
        """Test creating a guide with all fields."""
        guide_id = EntityId(str(uuid4()))
        title = GuideTitle("Learn Python")
        user_id = EntityId(str(uuid4()))
        now = datetime.now(UTC)

        guide = Guide(
            id=guide_id,
            guide_type=GuideType.COOKING,
            title=title,
            description="A guide to Python",
            metadata={
                "ingredients": [
                    {"name": "flour", "quantity": "200", "unit": "g"},
                ]
            },
            step_ids=[EntityId(str(uuid4())), EntityId(str(uuid4()))],
            created_by_user_id=user_id,
            is_public=True,
            is_highlighted=False,
            created_at=now,
            updated_at=now,
        )

        assert guide.id == guide_id
        assert guide.guide_type == GuideType.COOKING
        assert guide.title == title
        assert guide.description == "A guide to Python"
        expected_metadata = {
            "ingredients": [
                {"name": "flour", "quantity": "200", "unit": "g"},
            ]
        }
        assert guide.metadata == expected_metadata
        assert len(guide.step_ids) == 2
        assert guide.created_by_user_id == user_id
        assert guide.is_public is True
        assert guide.is_highlighted is False
        assert guide.created_at == now
        assert guide.updated_at == now

    def test_make_guide_public(self) -> None:
        """Test making a guide public."""
        guide = Guide(
            id=EntityId(str(uuid4())),
            guide_type=GuideType.GENERAL,
            title=GuideTitle("Learn Python"),
        )

        assert guide.is_public is False
        guide.make_public()
        assert guide.is_public is True

    def test_make_guide_private(self) -> None:
        """Test making a guide private."""
        guide = Guide(
            id=EntityId(str(uuid4())),
            guide_type=GuideType.GENERAL,
            title=GuideTitle("Learn Python"),
            is_public=True,
        )

        assert guide.is_public is True
        guide.make_private()
        assert guide.is_public is False

    def test_highlight_guide(self) -> None:
        """Test highlighting a guide."""
        guide = Guide(
            id=EntityId(str(uuid4())),
            guide_type=GuideType.GENERAL,
            title=GuideTitle("Learn Python"),
        )

        assert guide.is_highlighted is False
        guide.highlight()
        assert guide.is_highlighted is True

    def test_unhighlight_guide(self) -> None:
        """Test unhighlighting a guide."""
        guide = Guide(
            id=EntityId(str(uuid4())),
            guide_type=GuideType.GENERAL,
            title=GuideTitle("Learn Python"),
            is_highlighted=True,
        )

        assert guide.is_highlighted is True
        guide.unhighlight()
        assert guide.is_highlighted is False

    def test_visibility_changes_update_timestamp(self) -> None:
        """Test that visibility changes update the modified timestamp."""
        guide = Guide(
            id=EntityId(str(uuid4())),
            guide_type=GuideType.GENERAL,
            title=GuideTitle("Learn Python"),
        )

        original_updated_at = guide.updated_at
        guide.make_public()
        assert guide.updated_at > original_updated_at

    def test_highlight_changes_update_timestamp(self) -> None:
        """Test that highlight changes update the modified timestamp."""
        guide = Guide(
            id=EntityId(str(uuid4())),
            guide_type=GuideType.GENERAL,
            title=GuideTitle("Learn Python"),
        )

        original_updated_at = guide.updated_at
        guide.highlight()
        assert guide.updated_at > original_updated_at

    def test_update_guide_type(self) -> None:
        """Test changing guide type resets metadata."""
        guide = Guide(
            id=EntityId(str(uuid4())),
            guide_type=GuideType.COOKING,
            title=GuideTitle("My Recipe"),
            metadata={
                "ingredients": [
                    {"name": "flour", "quantity": "200", "unit": "g"},
                ]
            },
        )

        guide.update_guide_type(GuideType.WORKOUT)

        assert guide.guide_type == GuideType.WORKOUT
        assert guide.metadata is None

    def test_update_guide_type_with_new_metadata(self) -> None:
        """Test changing guide type with valid new metadata."""
        guide = Guide(
            id=EntityId(str(uuid4())),
            guide_type=GuideType.COOKING,
            title=GuideTitle("My Recipe"),
        )

        new_metadata = {
            "target_muscles": [
                {"name": "biceps", "focus": "primary"},
            ],
            "equipment": [
                {"name": "dumbbell", "weight": "10kg"},
            ],
        }
        guide.update_guide_type(GuideType.WORKOUT, new_metadata)

        assert guide.guide_type == GuideType.WORKOUT
        assert guide.metadata == new_metadata

    def test_update_guide_type_invalid_metadata_raises(self) -> None:
        """Test changing guide type with invalid metadata raises."""
        guide = Guide(
            id=EntityId(str(uuid4())),
            guide_type=GuideType.GENERAL,
            title=GuideTitle("My Guide"),
        )

        with pytest.raises(ValueError):
            guide.update_guide_type(
                GuideType.COOKING,
                {"invalid_key": "data"},
            )

    def test_update_guide_type_updates_timestamp(self) -> None:
        """Test that type change updates timestamp."""
        guide = Guide(
            id=EntityId(str(uuid4())),
            guide_type=GuideType.GENERAL,
            title=GuideTitle("My Guide"),
        )

        original = guide.updated_at
        guide.update_guide_type(GuideType.COOKING)
        assert guide.updated_at > original

    def test_reassign_user(self) -> None:
        """Test reassigning guide to a different user."""
        original_user = EntityId(str(uuid4()))
        new_user = EntityId(str(uuid4()))

        guide = Guide(
            id=EntityId(str(uuid4())),
            guide_type=GuideType.GENERAL,
            title=GuideTitle("My Guide"),
            created_by_user_id=original_user,
        )

        guide.reassign_user(new_user)

        assert guide.created_by_user_id == new_user

    def test_reassign_user_updates_timestamp(self) -> None:
        """Test that reassignment updates timestamp."""
        guide = Guide(
            id=EntityId(str(uuid4())),
            guide_type=GuideType.GENERAL,
            title=GuideTitle("My Guide"),
            created_by_user_id=EntityId(str(uuid4())),
        )

        original = guide.updated_at
        guide.reassign_user(EntityId(str(uuid4())))
        assert guide.updated_at > original
