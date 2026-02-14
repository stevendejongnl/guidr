"""MongoDB mapper for User entity."""

from typing import Any

from src.domain.entities import User
from src.domain.value_objects import Email, EntityId, Role, RoleType


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
            "preferredLanguages": user.preferred_languages,
            "role": user.role.value,  # New: Store role string
            "isAdmin": user.is_admin,  # Keep: Backward compatibility
            "isBeta": user.is_beta,
            "refreshTokenHash": user.refresh_token_hash,
        }

    @staticmethod
    def to_entity(document: dict[str, Any]) -> User:
        """Convert MongoDB document to User entity.

        Args:
            document: MongoDB document dict

        Returns:
            User entity
        """
        # Migration logic: prefer role field, fall back to isAdmin
        role_value = document.get("role")
        if role_value:
            role = Role(role_value)
        else:
            # Backward compatibility: derive role from isAdmin
            is_admin = document.get("isAdmin", False)
            role = Role(RoleType.ADMIN if is_admin else RoleType.USER)

        return User(
            id=EntityId(str(document["_id"])),
            email=Email(document["email"]),
            password_hash=document["passwordHash"],
            created_at=document["createdAt"],
            updated_at=document["updatedAt"],
            name=document.get("name"),
            interests=document.get("interests", []),
            preferred_languages=document.get(
                "preferredLanguages", ["en"]
            ),
            role=role,
            is_beta=document.get("isBeta", False),
            refresh_token_hash=document.get("refreshTokenHash"),
        )
