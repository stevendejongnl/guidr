"""MongoDB mapper for Category entity."""

from typing import Any, Optional
from datetime import datetime

from src.domain.entities import Category
from src.domain.value_objects import EntityId


class CategoryMapper:
    """Maps between Category entity and MongoDB document."""

    @staticmethod
    def to_document(category: Category) -> dict[str, Any]:
        """Convert Category entity to MongoDB document.

        Args:
            category: Category entity to convert

        Returns:
            MongoDB document dict
        """
        return {
            "_id": category.id.value,
            "name": category.name,
            "parentId": category.parent_id.value if category.parent_id else None,
            "createdAt": category.created_at,
            "updatedAt": category.updated_at,
        }

    @staticmethod
    def to_entity(document: dict[str, Any]) -> Category:
        """Convert MongoDB document to Category entity.

        Args:
            document: MongoDB document dict

        Returns:
            Category entity
        """
        return Category(
            id=EntityId(str(document["_id"])),
            name=document["name"],
            parent_id=EntityId(str(document["parentId"])) if document.get("parentId") else None,
            created_at=document["createdAt"],
            updated_at=document["updatedAt"],
        )
