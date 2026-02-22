"""Delete user use case (admin soft-delete)."""

from src.application.authorization import require_admin
from src.domain.entities import User
from src.domain.exceptions import EntityNotFoundException, ValidationException
from src.domain.repositories import IUserRepository
from src.domain.value_objects import EntityId


class DeleteUser:
    """Use case for soft-deleting a user (admin only)."""

    def __init__(self, user_repository: IUserRepository):
        """Initialize use case.

        Args:
            user_repository: Repository for user persistence
        """
        self._repository = user_repository

    async def execute(self, user_id: str, current_user: User) -> None:
        """Soft-delete a user (admin only).

        Args:
            user_id: ID of the user to delete
            current_user: Admin performing the deletion

        Raises:
            AuthorizationException: If current_user is not an admin
            ValidationException: If admin tries to delete their own account
            EntityNotFoundException: If user not found
        """
        require_admin(current_user)

        if user_id == current_user.id.value:
            raise ValidationException(
                "Cannot delete your own account via admin endpoint. "
                "Use DELETE /auth/account instead."
            )

        user = await self._repository.find_by_id(EntityId(user_id))
        if not user:
            raise EntityNotFoundException(f"User not found: {user_id}")

        await self._repository.delete(EntityId(user_id))
