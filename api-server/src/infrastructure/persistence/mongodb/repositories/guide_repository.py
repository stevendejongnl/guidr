"""MongoDB implementation of Guide repository."""

from typing import Optional
from motor.motor_asyncio import AsyncIOMotorDatabase

from src.domain.repositories import IGuideRepository
from src.domain.entities import Guide
from src.domain.value_objects import EntityId
from ..mappers import GuideMapper


class MongoGuideRepository(IGuideRepository):
    """MongoDB implementation of IGuideRepository."""

    def __init__(self, database: AsyncIOMotorDatabase):
        """Initialize repository.

        Args:
            database: MongoDB database instance
        """
        self._collection = database["guides"]
        self._mapper = GuideMapper()

    async def find_by_id(self, id: EntityId) -> Optional[Guide]:
        """Find guide by ID."""
        document = await self._collection.find_one({"_id": id.value})
        return self._mapper.to_entity(document) if document else None

    async def find_all(self) -> list[Guide]:
        """Find all guides."""
        cursor = self._collection.find()
        documents = await cursor.to_list(length=None)
        return [self._mapper.to_entity(doc) for doc in documents]

    async def find_by_category_id(self, category_id: EntityId) -> list[Guide]:
        """Find guides by category ID."""
        cursor = self._collection.find({"categoryId": category_id.value})
        documents = await cursor.to_list(length=None)
        return [self._mapper.to_entity(doc) for doc in documents]

    async def save(self, entity: Guide) -> None:
        """Save guide (upsert)."""
        document = self._mapper.to_document(entity)
        await self._collection.replace_one(
            {"_id": entity.id.value},
            document,
            upsert=True
        )

    async def delete(self, id: EntityId) -> None:
        """Delete guide by ID."""
        await self._collection.delete_one({"_id": id.value})
