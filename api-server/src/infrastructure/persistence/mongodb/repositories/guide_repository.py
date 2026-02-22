"""MongoDB implementation of Guide repository."""


from datetime import UTC, datetime

from motor.motor_asyncio import AsyncIOMotorDatabase

from src.domain.entities import Guide
from src.domain.repositories import IGuideRepository
from src.domain.value_objects import EntityId, GuideType

from ..mappers import GuideMapper


class MongoGuideRepository(IGuideRepository):
    """MongoDB implementation of IGuideRepository."""

    def __init__(self, database: AsyncIOMotorDatabase):
        """Initialize repository."""
        self._collection = database["guides"]
        self._mapper = GuideMapper()

    async def find_by_id(
        self, id: EntityId
    ) -> Guide | None:
        """Find guide by ID."""
        doc = await self._collection.find_one(
            {"_id": id.value, "deletedAt": None}
        )
        return self._mapper.to_entity(doc) if doc else None

    async def find_all(self) -> list[Guide]:
        """Find all non-deleted guides."""
        cursor = self._collection.find({"deletedAt": None})
        docs = await cursor.to_list(length=None)
        return [self._mapper.to_entity(d) for d in docs]

    async def find_by_type(
        self, guide_type: GuideType
    ) -> list[Guide]:
        """Find guides by type."""
        cursor = self._collection.find(
            {"guideType": guide_type.value, "deletedAt": None}
        )
        docs = await cursor.to_list(length=None)
        return [self._mapper.to_entity(d) for d in docs]

    async def find_by_user_id(
        self, user_id: EntityId
    ) -> list[Guide]:
        """Find all guides created by a specific user."""
        cursor = self._collection.find(
            {"createdByUserId": user_id.value, "deletedAt": None}
        )
        docs = await cursor.to_list(length=None)
        return [self._mapper.to_entity(d) for d in docs]

    async def find_public_guides(self) -> list[Guide]:
        """Find all public guides."""
        cursor = self._collection.find(
            {"isPublic": True, "deletedAt": None}
        )
        docs = await cursor.to_list(length=None)
        return [self._mapper.to_entity(d) for d in docs]

    async def find_highlighted_guides(self) -> list[Guide]:
        """Find all highlighted guides."""
        cursor = self._collection.find(
            {"isHighlighted": True, "isPublic": True, "deletedAt": None}
        )
        docs = await cursor.to_list(length=None)
        return [self._mapper.to_entity(d) for d in docs]

    async def find_accessible_by_user(
        self, user_id: EntityId | None
    ) -> list[Guide]:
        """Find guides accessible by a user."""
        if user_id is None:
            cursor = self._collection.find(
                {"isPublic": True, "deletedAt": None}
            )
        else:
            cursor = self._collection.find(
                {
                    "deletedAt": None,
                    "$or": [
                        {"isPublic": True},
                        {
                            "createdByUserId": user_id.value
                        },
                    ],
                }
            )
        docs = await cursor.to_list(length=None)
        return [self._mapper.to_entity(d) for d in docs]

    async def save(self, entity: Guide) -> None:
        """Save guide (upsert)."""
        document = self._mapper.to_document(entity)
        await self._collection.replace_one(
            {"_id": entity.id.value},
            document,
            upsert=True,
        )

    async def delete(self, id: EntityId) -> None:
        """Soft-delete guide by setting deletedAt timestamp."""
        now = datetime.now(UTC)
        await self._collection.update_one(
            {"_id": id.value},
            {"$set": {"deletedAt": now, "updatedAt": now}},
        )
