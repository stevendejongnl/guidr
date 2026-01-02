"""MongoDB implementation of Category repository."""

from typing import Optional
from motor.motor_asyncio import AsyncIOMotorDatabase

from src.domain.repositories import ICategoryRepository
from src.domain.entities import Category
from src.domain.value_objects import EntityId
from ..mappers import CategoryMapper


class MongoCategoryRepository(ICategoryRepository):
    """MongoDB implementation of ICategoryRepository."""

    def __init__(self, database: AsyncIOMotorDatabase):
        """Initialize repository.

        Args:
            database: MongoDB database instance
        """
        self._collection = database["categories"]
        self._mapper = CategoryMapper()

    async def find_by_id(self, id: EntityId) -> Optional[Category]:
        """Find category by ID."""
        document = await self._collection.find_one({"_id": id.value})
        return self._mapper.to_entity(document) if document else None

    async def find_all(self) -> list[Category]:
        """Find all categories."""
        cursor = self._collection.find()
        documents = await cursor.to_list(length=None)
        return [self._mapper.to_entity(doc) for doc in documents]

    async def find_by_parent_id(self, parent_id: Optional[EntityId]) -> list[Category]:
        """Find categories by parent ID."""
        filter_query = {"parentId": parent_id.value if parent_id else None}
        cursor = self._collection.find(filter_query)
        documents = await cursor.to_list(length=None)
        return [self._mapper.to_entity(doc) for doc in documents]

    async def save(self, entity: Category) -> None:
        """Save category (upsert)."""
        document = self._mapper.to_document(entity)
        await self._collection.replace_one(
            {"_id": entity.id.value},
            document,
            upsert=True
        )

    async def delete(self, id: EntityId) -> None:
        """Delete category by ID."""
        await self._collection.delete_one({"_id": id.value})
