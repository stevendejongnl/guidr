"""MongoDB mapper for User entity."""

from typing import Any

from src.domain.entities import User
from src.domain.value_objects import Email, EntityId


class UserMapper:
    """Maps between User entity and MongoDB document."""

    @staticmethod
    def to_document(user: User) -> dict[str, Any]:
        """Convert User entity to MongoDB document.

        Args:
            user: User entity to convert

        Returns:
            MongoDB document dict
        """
        return {
            "_id": user.id.value,
            "email": user.email.value,
            "passwordHash": user.password_hash,
            "createdAt": user.created_at,
            "updatedAt": user.updated_at,
            "name": user.name,
            "interests": user.interests,
            "isAdmin": user.is_admin,
        }

    @staticmethod
    def to_entity(document: dict[str, Any]) -> User:
        """Convert MongoDB document to User entity.

        Args:
            document: MongoDB document dict

        Returns:
            User entity
        """
        return User(
            id=EntityId(str(document["_id"])),
            email=Email(document["email"]),
            password_hash=document["passwordHash"],
            created_at=document["createdAt"],
            updated_at=document["updatedAt"],
            name=document.get("name"),
            interests=document.get("interests", []),
            is_admin=document.get("isAdmin", False),
        )
