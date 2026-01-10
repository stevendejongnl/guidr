"""Update guide use case."""


from src.application.authorization import require_admin
from src.application.dtos import GuideResponseDTO, GuideUpdateDTO
from src.application.mappers import GuideMapper
from src.domain.entities import User
from src.domain.exceptions import EntityNotFoundException
from src.domain.repositories import IGuideRepository
from src.domain.value_objects import EntityId, GuideTitle


class UpdateGuide:
    """Use case for updating a guide."""

    def __init__(self, guide_repository: IGuideRepository):
        """Initialize use case.

        Args:
            guide_repository: Repository for guide persistence
        """
        self._repository = guide_repository
        self._mapper = GuideMapper()

    async def execute(
        self, guide_id: str, dto: GuideUpdateDTO, current_user: User
    ) -> GuideResponseDTO | None:
        """Update a guide (admin only).

        Args:
            guide_id: Guide ID
            dto: Guide update data
            current_user: User performing the update (must be admin)

        Returns:
            GuideResponseDTO with updated guide data

        Raises:
            AuthorizationException: If user is not an admin
            EntityNotFoundException: If guide not found
        """
        require_admin(current_user)

        # Find existing guide
        guide = await self._repository.find_by_id(EntityId(guide_id))
        if not guide:
            raise EntityNotFoundException(f"Guide not found: {guide_id}")

        # Update fields if provided
        if dto.title is not None:
            guide.update_title(GuideTitle(dto.title))
        if dto.description is not None:
            guide.update_description(dto.description)

        # Save and return
        await self._repository.save(guide)
        return self._mapper.to_response_dto(guide)
