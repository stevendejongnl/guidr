"""Get guide use case."""


from src.application.dtos import GuideResponseDTO
from src.application.mappers import GuideMapper
from src.domain.repositories import IGuideRepository
from src.domain.value_objects import EntityId


class GetGuide:
    """Use case for getting a guide by ID."""

    def __init__(self, guide_repository: IGuideRepository):
        """Initialize use case.

        Args:
            guide_repository: Repository for guide persistence
        """
        self._repository = guide_repository
        self._mapper = GuideMapper()

    async def execute(self, guide_id: str, user=None) -> GuideResponseDTO | None:  # type: ignore[no-untyped-def]
        """Get a guide by ID (with visibility check).

        Args:
            guide_id: Guide ID
            user: Current user (optional, for visibility check)

        Returns:
            GuideResponseDTO if found, None otherwise
        """
        guide = await self._repository.find_by_id(EntityId(guide_id))
        if not guide:
            return None

        # Check visibility
        # Admin can see all guides
        if user and user.is_admin:
            return self._mapper.to_response_dto(guide)

        # Public guides visible to everyone
        if guide.is_public:
            return self._mapper.to_response_dto(guide)

        # User's own guides visible to them
        if user and guide.created_by_user_id and str(guide.created_by_user_id) == str(user.id):
            return self._mapper.to_response_dto(guide)

        # Private guides not visible to others
        return None
