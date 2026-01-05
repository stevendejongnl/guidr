"""MongoDB implementation of Session repository."""


from motor.motor_asyncio import AsyncIOMotorDatabase

from src.domain.entities import Session
from src.domain.repositories import ISessionRepository
from src.domain.value_objects import EntityId, SessionStatus

from ..mappers import SessionMapper


class MongoSessionRepository(ISessionRepository):
    """MongoDB implementation of ISessionRepository."""

    def __init__(self, database: AsyncIOMotorDatabase):
        """Initialize repository.

        Args:
            database: MongoDB database instance
        """
        self._collection = database["sessions"]
        self._mapper = SessionMapper()

    async def find_by_id(self, id: EntityId) -> Session | None:
        """Find session by ID."""
        document = await self._collection.find_one({"_id": id.value})
        return self._mapper.to_entity(document) if document else None

    async def find_all(self) -> list[Session]:
        """Find all sessions."""
        cursor = self._collection.find()
        documents = await cursor.to_list(length=None)
        return [self._mapper.to_entity(doc) for doc in documents]

    async def find_by_guide_id(self, guide_id: EntityId) -> list[Session]:
        """Find sessions by guide ID."""
        cursor = self._collection.find({"guideId": guide_id.value})
        documents = await cursor.to_list(length=None)
        return [self._mapper.to_entity(doc) for doc in documents]

    async def find_by_status(self, status: SessionStatus) -> list[Session]:
        """Find sessions by status."""
        cursor = self._collection.find({"status": status.value})
        documents = await cursor.to_list(length=None)
        return [self._mapper.to_entity(doc) for doc in documents]

    async def save(self, entity: Session) -> None:
        """Save session (upsert)."""
        document = self._mapper.to_document(entity)
        await self._collection.replace_one(
            {"_id": entity.id.value},
            document,
            upsert=True
        )

    async def delete(self, id: EntityId) -> None:
        """Delete session by ID."""
        await self._collection.delete_one({"_id": id.value})
