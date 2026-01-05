"""MongoDB implementation of Step repository."""


from motor.motor_asyncio import AsyncIOMotorDatabase

from src.domain.entities import Step
from src.domain.repositories import IStepRepository
from src.domain.value_objects import EntityId

from ..mappers import StepMapper


class MongoStepRepository(IStepRepository):
    """MongoDB implementation of IStepRepository."""

    def __init__(self, database: AsyncIOMotorDatabase):
        """Initialize repository.

        Args:
            database: MongoDB database instance
        """
        self._collection = database["steps"]
        self._mapper = StepMapper()

    async def find_by_id(self, id: EntityId) -> Step | None:
        """Find step by ID."""
        document = await self._collection.find_one({"_id": id.value})
        return self._mapper.to_entity(document) if document else None

    async def find_all(self) -> list[Step]:
        """Find all steps."""
        cursor = self._collection.find()
        documents = await cursor.to_list(length=None)
        return [self._mapper.to_entity(doc) for doc in documents]

    async def find_by_guide_id(self, guide_id: EntityId) -> list[Step]:
        """Find steps by guide ID, ordered by order field."""
        cursor = self._collection.find({"guideId": guide_id.value}).sort("order", 1)
        documents = await cursor.to_list(length=None)
        return [self._mapper.to_entity(doc) for doc in documents]

    async def save(self, entity: Step) -> None:
        """Save step (upsert)."""
        document = self._mapper.to_document(entity)
        await self._collection.replace_one(
            {"_id": entity.id.value},
            document,
            upsert=True
        )

    async def delete(self, id: EntityId) -> None:
        """Delete step by ID."""
        await self._collection.delete_one({"_id": id.value})
