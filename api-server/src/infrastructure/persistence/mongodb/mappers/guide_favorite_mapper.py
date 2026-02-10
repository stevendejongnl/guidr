"""MongoDB mapper for GuideFavorite entity."""

from typing import Any

from src.domain.entities import GuideFavorite
from src.domain.value_objects import EntityId


class GuideFavoriteMapper:
    """Maps between GuideFavorite entity and MongoDB document."""

    @staticmethod
    def to_document(favorite: GuideFavorite) -> dict[str, Any]:
        """Convert GuideFavorite entity to MongoDB document.

        Args:
            favorite: GuideFavorite entity to convert

        Returns:
            MongoDB document dict
        """
        return {
            "_id": favorite.id.value,
            "userId": favorite.user_id.value,
            "guideId": favorite.guide_id.value,
            "createdAt": favorite.created_at,
        }

    @staticmethod
    def to_entity(document: dict[str, Any]) -> GuideFavorite:
        """Convert MongoDB document to GuideFavorite entity.

        Args:
            document: MongoDB document dict

        Returns:
            GuideFavorite entity
        """
        return GuideFavorite(
            id=EntityId(str(document["_id"])),
            user_id=EntityId(str(document["userId"])),
            guide_id=EntityId(str(document["guideId"])),
            created_at=document["createdAt"],
        )
