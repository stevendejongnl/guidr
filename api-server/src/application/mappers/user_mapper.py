"""User mapper for entity-DTO conversion."""

from src.application.dtos import UserResponseDTO
from src.domain.entities import User


class UserMapper:
    """Mapper for User entity to DTOs."""

    @staticmethod
    def to_response_dto(user: User) -> UserResponseDTO:
        """Convert User entity to UserResponseDTO.

        Args:
            user: User entity

        Returns:
            UserResponseDTO with all user data (excluding password_hash)
        """
        return UserResponseDTO(
            id=user.id.value,
            email=user.email.value,
            created_at=user.created_at.isoformat(),
            updated_at=user.updated_at.isoformat(),
            name=user.name,
            interests=user.interests if user.interests else None,
            preferred_languages=user.preferred_languages,
            role=user.role.value,  # New: Include role
            is_admin=user.is_admin,  # Keep: Backward compatibility
            is_beta=user.is_beta,
        )
