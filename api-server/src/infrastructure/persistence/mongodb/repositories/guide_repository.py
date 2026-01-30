"""MongoDB implementation of Guide repository."""


from motor.motor_asyncio import AsyncIOMotorDatabase

from src.domain.entities import Guide
from src.domain.repositories import IGuideRepository
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

    async def find_by_id(self, id: EntityId) -> Guide | None:
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

    async def find_by_user_id(self, user_id: EntityId) -> list[Guide]:
        """Find all guides created by a specific user."""
        cursor = self._collection.find({"createdByUserId": user_id.value})
        documents = await cursor.to_list(length=None)
        return [self._mapper.to_entity(doc) for doc in documents]

    async def find_public_guides(self) -> list[Guide]:
        """Find all public guides."""
        cursor = self._collection.find({"isPublic": True})
        documents = await cursor.to_list(length=None)
        return [self._mapper.to_entity(doc) for doc in documents]

    async def find_highlighted_guides(self) -> list[Guide]:
        """Find all highlighted guides."""
        cursor = self._collection.find({"isHighlighted": True, "isPublic": True})
        documents = await cursor.to_list(length=None)
        return [self._mapper.to_entity(doc) for doc in documents]

    async def find_accessible_by_user(self, user_id: EntityId | None) -> list[Guide]:
        """Find guides accessible by a user (public + user's own guides)."""
        if user_id is None:
            # Unauthenticated: only public guides
            cursor = self._collection.find({"isPublic": True})
        else:
            # Authenticated: public guides + own guides
            cursor = self._collection.find({
                "$or": [
                    {"isPublic": True},
                    {"createdByUserId": user_id.value}
                ]
            })
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
