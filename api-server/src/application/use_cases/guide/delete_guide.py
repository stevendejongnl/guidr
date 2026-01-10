"""Delete guide use case."""

from src.application.authorization import require_admin
from src.domain.entities import User
from src.domain.repositories import IGuideRepository
from src.domain.value_objects import EntityId


class DeleteGuide:
    """Use case for deleting a guide."""

    def __init__(self, guide_repository: IGuideRepository):
        """Initialize use case.

        Args:
            guide_repository: Repository for guide persistence
        """
        self._repository = guide_repository

    async def execute(self, guide_id: str, current_user: User) -> None:
        """Delete a guide (admin only).

        Args:
            guide_id: Guide ID
            current_user: User performing the deletion (must be admin)

        Raises:
            AuthorizationException: If user is not an admin
        """
        require_admin(current_user)
        await self._repository.delete(EntityId(guide_id))
