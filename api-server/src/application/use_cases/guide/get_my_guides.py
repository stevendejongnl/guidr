"""Get my guides use case."""

from src.application.dtos import GuideResponseDTO
from src.application.mappers import GuideMapper
from src.domain.entities import User
from src.domain.repositories import IGuideRepository, IStepRepository, IUserRepository
from src.domain.value_objects import EntityId


class GetMyGuides:
    """Use case for getting guides owned by the authenticated user."""

    def __init__(
        self,
        guide_repository: IGuideRepository,
        step_repository: IStepRepository,
        user_repository: IUserRepository,
    ):
        self._repository = guide_repository
        self._step_repository = step_repository
        self._user_repository = user_repository
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
        result = []
        for guide in guides:
            steps = await self._step_repository.find_by_guide_id(EntityId(guide.id.value))
            total_duration = sum(
                s.duration.value for s in steps if s.duration is not None
            ) or None
            created_by_name: str | None = None
            if guide.created_by_user_id:
                author = await self._user_repository.find_by_id(guide.created_by_user_id)
                if author:
                    created_by_name = author.name
            result.append(self._mapper.to_response_dto(
                guide, total_duration=total_duration, created_by_name=created_by_name,
            ))
        return result
