"""MongoDB implementation of User repository."""

from typing import Optional
from motor.motor_asyncio import AsyncIOMotorDatabase

from src.domain.repositories import IUserRepository
from src.domain.entities import User
from src.domain.value_objects import EntityId, Email
from ..mappers import UserMapper


class MongoUserRepository(IUserRepository):
    """MongoDB implementation of IUserRepository."""

    def __init__(self, database: AsyncIOMotorDatabase):
        """Initialize repository.

        Args:
            database: MongoDB database instance
        """
        self._collection = database["users"]
        self._mapper = UserMapper()

    async def find_by_id(self, id: EntityId) -> Optional[User]:
        """Find user by ID."""
        document = await self._collection.find_one({"_id": id.value})
        return self._mapper.to_entity(document) if document else None

    async def find_all(self) -> list[User]:
        """Find all users."""
        cursor = self._collection.find()
        documents = await cursor.to_list(length=None)
        return [self._mapper.to_entity(doc) for doc in documents]

    async def find_by_email(self, email: Email) -> Optional[User]:
        """Find user by email."""
        document = await self._collection.find_one({"email": email.value})
        return self._mapper.to_entity(document) if document else None

    async def save(self, entity: User) -> None:
        """Save user (upsert)."""
        document = self._mapper.to_document(entity)
        await self._collection.replace_one(
            {"_id": entity.id.value},
            document,
            upsert=True
        )

    async def delete(self, id: EntityId) -> None:
        """Delete user by ID."""
        await self._collection.delete_one({"_id": id.value})
