"""Update guide use case."""


from src.application.authorization import require_admin, require_owner_or_admin
from src.application.dtos import GuideResponseDTO, GuideUpdateDTO
from src.application.mappers import GuideMapper
from src.domain.entities import User
from src.domain.events import GuideUpdated
from src.domain.exceptions import EntityNotFoundException
from src.domain.repositories import IGuideRepository
from src.domain.services import EventPersistenceService
from src.domain.value_objects import EntityId, GuideTitle


class UpdateGuide:
    """Use case for updating a guide."""

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
        self._mapper = GuideMapper()

    async def execute(
        self, guide_id: str, dto: GuideUpdateDTO, current_user: User
    ) -> GuideResponseDTO | None:
        """Update a guide (owner or admin).

        Args:
            guide_id: Guide ID
            dto: Guide update data
            current_user: User performing the update (owner or admin)

        Returns:
            GuideResponseDTO with updated guide data

        Raises:
            AuthorizationException: If user is not owner or admin
            EntityNotFoundException: If guide not found
        """
        # Find existing guide
        guide = await self._repository.find_by_id(EntityId(guide_id))
        if not guide:
            raise EntityNotFoundException(f"Guide not found: {guide_id}")

        # Check authorization upfront
        # If highlighting is requested, require admin immediately
        if dto.is_highlighted is not None:
            require_admin(current_user)
        else:
            # For other updates (title, description, is_public), require owner or admin
            require_owner_or_admin(current_user, guide.created_by_user_id)

        # Update basic fields if provided (owner or admin)
        if dto.title is not None:
            guide.update_title(GuideTitle(dto.title))
        if dto.description is not None:
            guide.update_description(dto.description)

        # Handle visibility (owner or admin can change)
        if dto.is_public is not None:
            if dto.is_public:
                guide.make_public()
            else:
                guide.make_private()

        # Handle highlighting (admin only - already checked above)
        if dto.is_highlighted is not None:
            if dto.is_highlighted:
                guide.highlight()
            else:
                guide.unhighlight()

        # Save guide
        await self._repository.save(guide)

        # Persist event
        update_event = GuideUpdated(
            guide_id=guide_id,
            title=guide.title.value,
            description=guide.description,
        )
        await self._event_persistence.persist_event(
            update_event,
            user_id=current_user.id.value,
        )

        return self._mapper.to_response_dto(guide)
