"""MongoDB mapper for Guide entity."""

from typing import Any

from src.domain.entities import Guide
from src.domain.value_objects import EntityId, GuideTitle


class GuideMapper:
    """Maps between Guide entity and MongoDB document."""

    @staticmethod
    def to_document(guide: Guide) -> dict[str, Any]:
        """Convert Guide entity to MongoDB document.

        Args:
            guide: Guide entity to convert

        Returns:
            MongoDB document dict
        """
        return {
            "_id": guide.id.value,
            "categoryId": guide.category_id.value,
            "title": guide.title.value,
            "description": guide.description,
            "stepIds": [step_id.value for step_id in guide.step_ids],
            "createdAt": guide.created_at,
            "updatedAt": guide.updated_at,
        }

    @staticmethod
    def to_entity(document: dict[str, Any]) -> Guide:
        """Convert MongoDB document to Guide entity.

        Args:
            document: MongoDB document dict

        Returns:
            Guide entity
        """
        return Guide(
            id=EntityId(str(document["_id"])),
            category_id=EntityId(str(document["categoryId"])),
            title=GuideTitle(document["title"]),
            description=document.get("description"),
            step_ids=[EntityId(str(step_id)) for step_id in document.get("stepIds", [])],
            created_at=document["createdAt"],
            updated_at=document["updatedAt"],
        )
