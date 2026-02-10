"""MongoDB implementation of GuideFavorite repository."""

from motor.motor_asyncio import AsyncIOMotorDatabase

from src.domain.entities import GuideFavorite
from src.domain.repositories import IGuideFavoriteRepository
from src.domain.value_objects import EntityId

from ..mappers import GuideFavoriteMapper


class MongoGuideFavoriteRepository(IGuideFavoriteRepository):
    """MongoDB implementation of IGuideFavoriteRepository."""

    def __init__(self, database: AsyncIOMotorDatabase):
        """Initialize repository.

        Args:
            database: MongoDB database instance
        """
        self._collection = database["guide_favorites"]
        self._mapper = GuideFavoriteMapper()

    async def find_by_id(self, id: EntityId) -> GuideFavorite | None:
        """Find favorite by ID."""
        document = await self._collection.find_one({"_id": id.value})
        return self._mapper.to_entity(document) if document else None

    async def find_all(self) -> list[GuideFavorite]:
        """Find all favorites."""
        cursor = self._collection.find()
        documents = await cursor.to_list(length=None)
        return [self._mapper.to_entity(doc) for doc in documents]

    async def find_by_user_id(
        self, user_id: EntityId
    ) -> list[GuideFavorite]:
        """Find all favorites for a user."""
        cursor = self._collection.find(
            {"userId": user_id.value}
        )
        documents = await cursor.to_list(length=None)
        return [self._mapper.to_entity(doc) for doc in documents]

    async def find_by_user_and_guide(
        self, user_id: EntityId, guide_id: EntityId
    ) -> GuideFavorite | None:
        """Find a favorite by user ID and guide ID."""
        document = await self._collection.find_one(
            {"userId": user_id.value, "guideId": guide_id.value}
        )
        return self._mapper.to_entity(document) if document else None

    async def save(self, entity: GuideFavorite) -> None:
        """Save favorite (upsert)."""
        document = self._mapper.to_document(entity)
        await self._collection.replace_one(
            {"_id": entity.id.value},
            document,
            upsert=True,
        )

    async def delete(self, id: EntityId) -> None:
        """Delete favorite by ID."""
        await self._collection.delete_one({"_id": id.value})

    async def delete_by_user_and_guide(
        self, user_id: EntityId, guide_id: EntityId
    ) -> None:
        """Delete a favorite by user ID and guide ID."""
        await self._collection.delete_one(
            {"userId": user_id.value, "guideId": guide_id.value}
        )
