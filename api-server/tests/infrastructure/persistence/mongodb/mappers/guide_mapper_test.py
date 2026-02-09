"""Tests for GuideMapper."""

from datetime import UTC, datetime
from uuid import uuid4

from src.domain.entities import Guide
from src.domain.value_objects import EntityId, GuideTitle, GuideType
from src.infrastructure.persistence.mongodb.mappers import GuideMapper


class TestGuideMapper:
    """Test suite for GuideMapper."""

    def test_map_guide_to_document(self) -> None:
        """Test mapping a Guide entity to MongoDB document."""
        guide_id = EntityId(str(uuid4()))
        user_id = EntityId(str(uuid4()))
        now = datetime.now(UTC)

        guide = Guide(
            id=guide_id,
            guide_type=GuideType.COOKING,
            title=GuideTitle("Learn Python"),
            description="A guide to Python",
            metadata={"ingredients": ["flour"]},
            step_ids=[EntityId(str(uuid4())), EntityId(str(uuid4()))],
            created_by_user_id=user_id,
            is_public=True,
            is_highlighted=False,
            created_at=now,
            updated_at=now,
        )

        document = GuideMapper.to_document(guide)

        assert document["_id"] == guide_id.value
        assert document["guideType"] == "cooking"
        assert document["title"] == "Learn Python"
        assert document["description"] == "A guide to Python"
        assert document["metadata"] == {"ingredients": ["flour"]}
        assert len(document["stepIds"]) == 2
        assert document["createdByUserId"] == user_id.value
        assert document["isPublic"] is True
        assert document["isHighlighted"] is False
        assert document["createdAt"] == now
        assert document["updatedAt"] == now

    def test_map_document_to_guide(self) -> None:
        """Test mapping a MongoDB document to Guide entity."""
        guide_id = str(uuid4())
        user_id = str(uuid4())
        step_ids = [str(uuid4()), str(uuid4())]
        now = datetime.now(UTC)

        document = {
            "_id": guide_id,
            "guideType": "cooking",
            "title": "Learn Python",
            "description": "A guide to Python",
            "metadata": {"ingredients": ["flour"]},
            "stepIds": step_ids,
            "createdByUserId": user_id,
            "isPublic": True,
            "isHighlighted": False,
            "createdAt": now,
            "updatedAt": now,
        }

        guide = GuideMapper.to_entity(document)

        assert guide.id == EntityId(guide_id)
        assert guide.guide_type == GuideType.COOKING
        assert guide.title == GuideTitle("Learn Python")
        assert guide.description == "A guide to Python"
        assert guide.metadata == {"ingredients": ["flour"]}
        assert len(guide.step_ids) == 2
        assert guide.created_by_user_id == EntityId(user_id)
        assert guide.is_public is True
        assert guide.is_highlighted is False
        assert guide.created_at == now
        assert guide.updated_at == now

    def test_map_guide_without_optional_fields(self) -> None:
        """Test mapping a guide without optional fields."""
        guide_id = EntityId(str(uuid4()))

        guide = Guide(
            id=guide_id,
            guide_type=GuideType.GENERAL,
            title=GuideTitle("Quick Guide"),
        )

        document = GuideMapper.to_document(guide)

        assert document["_id"] == guide_id.value
        assert document["guideType"] == "general"
        assert document["title"] == "Quick Guide"
        assert document["description"] is None
        assert document["metadata"] is None
        assert document["stepIds"] == []
        assert document["createdByUserId"] is None
        assert document["isPublic"] is False
        assert document["isHighlighted"] is False

    def test_map_document_without_optional_fields(self) -> None:
        """Test mapping a document without optional fields."""
        guide_id = str(uuid4())
        now = datetime.now(UTC)

        document = {
            "_id": guide_id,
            "guideType": "general",
            "title": "Learn Python",
            "createdAt": now,
            "updatedAt": now,
        }

        guide = GuideMapper.to_entity(document)

        assert guide.id == EntityId(guide_id)
        assert guide.guide_type == GuideType.GENERAL
        assert guide.title == GuideTitle("Learn Python")
        assert guide.description is None
        assert guide.metadata is None
        assert guide.step_ids == []
        assert guide.created_by_user_id is None
        assert guide.is_public is False
        assert guide.is_highlighted is False
