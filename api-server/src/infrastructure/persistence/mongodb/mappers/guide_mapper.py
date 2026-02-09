"""MongoDB mapper for Guide entity."""

from typing import Any

from src.domain.entities import Guide
from src.domain.value_objects import EntityId, GuideTitle, GuideType


class GuideMapper:
    """Maps between Guide entity and MongoDB document."""

    @staticmethod
    def to_document(guide: Guide) -> dict[str, Any]:
        """Convert Guide entity to MongoDB document."""
        return {
            "_id": guide.id.value,
            "guideType": guide.guide_type.value,
            "title": guide.title.value,
            "description": guide.description,
            "metadata": guide.metadata,
            "stepIds": [
                step_id.value
                for step_id in guide.step_ids
            ],
            "createdByUserId": (
                guide.created_by_user_id.value
                if guide.created_by_user_id
                else None
            ),
            "isPublic": guide.is_public,
            "isHighlighted": guide.is_highlighted,
            "createdAt": guide.created_at,
            "updatedAt": guide.updated_at,
        }

    @staticmethod
    def to_entity(document: dict[str, Any]) -> Guide:
        """Convert MongoDB document to Guide entity."""
        created_by_user_id = document.get(
            "createdByUserId"
        )
        return Guide(
            id=EntityId(str(document["_id"])),
            guide_type=GuideType(document["guideType"]),
            title=GuideTitle(document["title"]),
            description=document.get("description"),
            metadata=document.get("metadata"),
            step_ids=[
                EntityId(str(sid))
                for sid in document.get("stepIds", [])
            ],
            created_by_user_id=(
                EntityId(str(created_by_user_id))
                if created_by_user_id
                else None
            ),
            is_public=document.get("isPublic", False),
            is_highlighted=document.get(
                "isHighlighted", False
            ),
            created_at=document["createdAt"],
            updated_at=document["updatedAt"],
        )
