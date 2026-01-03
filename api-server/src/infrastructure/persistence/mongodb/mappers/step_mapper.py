"""MongoDB mapper for Step entity."""

from typing import Any

from src.domain.entities import Step
from src.domain.value_objects import EntityId, StepDuration


class StepMapper:
    """Maps between Step entity and MongoDB document."""

    @staticmethod
    def to_document(step: Step) -> dict[str, Any]:
        """Convert Step entity to MongoDB document.

        Args:
            step: Step entity to convert

        Returns:
            MongoDB document dict
        """
        return {
            "_id": step.id.value,
            "guideId": step.guide_id.value,
            "order": step.order,
            "title": step.title,
            "description": step.description,
            "duration": step.duration.value,
            "createdAt": step.created_at,
            "updatedAt": step.updated_at,
        }

    @staticmethod
    def to_entity(document: dict[str, Any]) -> Step:
        """Convert MongoDB document to Step entity.

        Args:
            document: MongoDB document dict

        Returns:
            Step entity
        """
        return Step(
            id=EntityId(str(document["_id"])),
            guide_id=EntityId(str(document["guideId"])),
            order=document["order"],
            title=document["title"],
            duration=StepDuration(document["duration"]),
            description=document.get("description"),
            created_at=document["createdAt"],
            updated_at=document["updatedAt"],
        )
