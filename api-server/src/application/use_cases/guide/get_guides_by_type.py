"""Get guides by type use case."""

from src.application.dtos import GuideResponseDTO
from src.application.mappers import GuideMapper
from src.domain.repositories import IGuideRepository, IStepRepository, IUserRepository
from src.domain.value_objects import EntityId, GuideType


class GetGuidesByType:
    """Use case for getting guides by type."""

    def __init__(
        self,
        guide_repository: IGuideRepository,
        step_repository: IStepRepository,
        user_repository: IUserRepository,
    ):
        """Initialize use case."""
        self._repository = guide_repository
        self._step_repository = step_repository
        self._user_repository = user_repository
        self._mapper = GuideMapper()

    async def execute(self, guide_type: str, user=None) -> list[GuideResponseDTO]:  # type: ignore[no-untyped-def]
        """Get guides by type (filtered by visibility).

        Args:
            guide_type: Guide type string
            user: Current user (optional)

        Returns:
            List of GuideResponseDTO
        """
        gt = GuideType(guide_type)
        guides = await self._repository.find_by_type(gt)

        filtered_guides = []
        for guide in guides:
            if user and user.is_admin:
                filtered_guides.append(guide)
            elif guide.is_public:
                filtered_guides.append(guide)
            elif (
                user
                and guide.created_by_user_id
                and str(guide.created_by_user_id)
                == str(user.id)
            ):
                filtered_guides.append(guide)

        result = []
        for guide in filtered_guides:
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
