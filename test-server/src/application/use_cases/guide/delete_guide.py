"""Delete guide use case."""

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

    async def execute(self, guide_id: str) -> None:
        """Delete a guide.

        Args:
            guide_id: Guide ID
        """
        await self._repository.delete(EntityId(guide_id))
