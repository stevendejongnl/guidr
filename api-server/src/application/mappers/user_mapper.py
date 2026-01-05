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
        )
