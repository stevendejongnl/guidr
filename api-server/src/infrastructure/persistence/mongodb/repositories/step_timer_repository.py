"""MongoDB implementation of StepTimer repository."""

from motor.motor_asyncio import AsyncIOMotorDatabase

from src.domain.entities import StepTimer
from src.domain.repositories import IStepTimerRepository
from src.domain.value_objects import EntityId

from ..mappers import StepTimerMapper


class MongoStepTimerRepository(IStepTimerRepository):
    """MongoDB implementation of IStepTimerRepository."""

    def __init__(self, database: AsyncIOMotorDatabase):
        """Initialize repository.

        Args:
            database: MongoDB database instance
        """
        self._collection = database["step_timers"]
        self._mapper = StepTimerMapper()

    async def find_by_id(self, id: EntityId) -> StepTimer | None:
        """Find timer by ID."""
        document = await self._collection.find_one({"_id": id.value})
        return self._mapper.to_entity(document) if document else None

    async def find_all(self) -> list[StepTimer]:
        """Find all timers."""
        cursor = self._collection.find()
        documents = await cursor.to_list(length=None)
        return [self._mapper.to_entity(doc) for doc in documents]

    async def find_by_step_and_user(
        self, step_id: EntityId, user_id: EntityId
    ) -> StepTimer | None:
        """Find timer by step ID and user ID."""
        document = await self._collection.find_one(
            {"stepId": step_id.value, "userId": user_id.value}
        )
        return self._mapper.to_entity(document) if document else None

    async def find_by_guide_and_user(
        self, guide_id: EntityId, user_id: EntityId
    ) -> list[StepTimer]:
        """Find all timers for a guide and user."""
        cursor = self._collection.find(
            {"guideId": guide_id.value, "userId": user_id.value}
        )
        documents = await cursor.to_list(length=None)
        return [self._mapper.to_entity(doc) for doc in documents]

    async def save(self, entity: StepTimer) -> None:
        """Save timer (upsert)."""
        document = self._mapper.to_document(entity)
        await self._collection.replace_one(
            {"_id": entity.id.value},
            document,
            upsert=True,
        )

    async def delete(self, id: EntityId) -> None:
        """Delete timer by ID."""
        await self._collection.delete_one({"_id": id.value})

    async def delete_by_guide_and_user(
        self, guide_id: EntityId, user_id: EntityId
    ) -> None:
        """Delete all timers for a guide and user."""
        await self._collection.delete_many(
            {"guideId": guide_id.value, "userId": user_id.value}
        )
