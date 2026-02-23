"""Get my guides use case."""

from src.application.dtos import GuideResponseDTO
from src.application.mappers import GuideMapper
from src.domain.entities import User
from src.domain.repositories import IGuideRepository


class GetMyGuides:
    """Use case for getting guides owned by the authenticated user."""

    def __init__(self, guide_repository: IGuideRepository):
        self._repository = guide_repository
        self._mapper = GuideMapper()

    async def execute(self, user: User) -> list[GuideResponseDTO]:
        """Get all guides created by the given user.

        Uses a DB-level filter (find_by_user_id) rather than fetching
        all guides and filtering in Python.

        Args:
            user: The authenticated user whose guides to retrieve

        Returns:
            List of GuideResponseDTO for the user's guides (may be empty)
        """
        guides = await self._repository.find_by_user_id(user.id)
        return [self._mapper.to_response_dto(guide) for guide in guides]
