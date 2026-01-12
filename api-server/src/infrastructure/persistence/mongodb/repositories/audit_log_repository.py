"""MongoDB implementation of AuditLog repository."""

from datetime import datetime

from motor.motor_asyncio import AsyncIOMotorDatabase

from src.domain.entities import AuditLog
from src.domain.repositories import IAuditLogRepository
from src.domain.value_objects import EntityId

from ..mappers import AuditLogMapper


class MongoAuditLogRepository(IAuditLogRepository):
    """MongoDB implementation of IAuditLogRepository."""

    def __init__(self, database: AsyncIOMotorDatabase):
        """Initialize repository.

        Args:
            database: MongoDB database instance
        """
        self._collection = database["audit_logs"]
        self._mapper = AuditLogMapper()

    async def find_by_id(self, id: EntityId) -> AuditLog | None:
        """Find audit log by ID."""
        document = await self._collection.find_one({"_id": id.value})
        return self._mapper.to_entity(document) if document else None

    async def find_all(self) -> list[AuditLog]:
        """Find all audit logs (limited for performance)."""
        cursor = self._collection.find().sort("occurredAt", -1).limit(1000)
        documents = await cursor.to_list(length=1000)
        return [self._mapper.to_entity(doc) for doc in documents]

    async def save(self, entity: AuditLog) -> None:
        """Save audit log (insert only, no updates)."""
        document = self._mapper.to_document(entity)
        await self._collection.insert_one(document)

    async def delete(self, id: EntityId) -> None:
        """Delete audit log (not recommended - audit logs should be immutable)."""
        await self._collection.delete_one({"_id": id.value})

    async def find_by_user(
        self, user_id: str, limit: int = 100, offset: int = 0
    ) -> list[AuditLog]:
        """Find audit logs for a specific user."""
        cursor = (
            self._collection.find({"userId": user_id})
            .sort("occurredAt", -1)
            .skip(offset)
            .limit(limit)
        )
        documents = await cursor.to_list(length=limit)
        return [self._mapper.to_entity(doc) for doc in documents]

    async def find_by_resource(
        self, resource_type: str, resource_id: str
    ) -> list[AuditLog]:
        """Find audit logs for a specific resource."""
        cursor = self._collection.find(
            {
                "resourceType": resource_type,
                "resourceId": resource_id,
            }
        ).sort("occurredAt", -1)
        documents = await cursor.to_list(length=None)
        return [self._mapper.to_entity(doc) for doc in documents]

    async def find_by_date_range(
        self, start_date: datetime, end_date: datetime, limit: int = 1000
    ) -> list[AuditLog]:
        """Find audit logs within a date range."""
        cursor = (
            self._collection.find(
                {
                    "occurredAt": {"$gte": start_date, "$lte": end_date}
                }
            )
            .sort("occurredAt", -1)
            .limit(limit)
        )
        documents = await cursor.to_list(length=limit)
        return [self._mapper.to_entity(doc) for doc in documents]

    async def find_admin_actions(
        self, limit: int = 100, offset: int = 0
    ) -> list[AuditLog]:
        """Find all admin actions."""
        cursor = (
            self._collection.find(
                {
                    "action": {"$in": ["deleted", "updated"]},
                    "resourceType": {"$in": ["guide", "category"]},
                }
            )
            .sort("occurredAt", -1)
            .skip(offset)
            .limit(limit)
        )
        documents = await cursor.to_list(length=limit)
        return [self._mapper.to_entity(doc) for doc in documents]
