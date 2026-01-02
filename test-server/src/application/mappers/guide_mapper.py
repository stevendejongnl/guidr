"""Guide mapper for entity-DTO conversion."""

from src.domain.entities import Guide
from src.application.dtos import GuideResponseDTO


class GuideMapper:
    """Mapper for Guide entity to DTOs."""

    @staticmethod
    def to_response_dto(guide: Guide) -> GuideResponseDTO:
        """Convert Guide entity to GuideResponseDTO.

        Args:
            guide: Guide entity

        Returns:
            GuideResponseDTO with all guide data
        """
        return GuideResponseDTO(
            id=guide.id.value,
            category_id=guide.category_id.value,
            title=guide.title.value,
            description=guide.description,
            step_ids=[step_id.value for step_id in guide.step_ids],
            created_at=guide.created_at.isoformat(),
            updated_at=guide.updated_at.isoformat(),
        )
