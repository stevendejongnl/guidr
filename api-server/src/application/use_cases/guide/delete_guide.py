"""Delete guide use case."""

from src.application.authorization import require_admin
from src.domain.entities import User
from src.domain.events import GuideDeleted
from src.domain.exceptions import EntityNotFoundException
from src.domain.repositories import IGuideRepository
from src.domain.services import EventPersistenceService
from src.domain.value_objects import EntityId


class DeleteGuide:
    """Use case for deleting a guide."""

    def __init__(
        self,
        guide_repository: IGuideRepository,
        event_persistence_service: EventPersistenceService,
    ):
        """Initialize use case.

        Args:
            guide_repository: Repository for guide persistence
            event_persistence_service: Service for persisting domain events
        """
        self._repository = guide_repository
        self._event_persistence = event_persistence_service

    async def execute(self, guide_id: str, current_user: User) -> None:
        """Delete a guide (admin only).

        Args:
            guide_id: Guide ID
            current_user: User performing the deletion (must be admin)

        Raises:
            AuthorizationException: If user is not an admin
            EntityNotFoundException: If guide not found
        """
        require_admin(current_user)

        # Fetch guide for audit details
        guide = await self._repository.find_by_id(EntityId(guide_id))
        if not guide:
            raise EntityNotFoundException(f"Guide not found: {guide_id}")

        # Delete guide
        await self._repository.delete(EntityId(guide_id))

        # Persist event
        delete_event = GuideDeleted(
            guide_id=guide_id,
            title=guide.title.value,
        )
        await self._event_persistence.persist_event(
            delete_event,
            user_id=current_user.id.value,
        )
