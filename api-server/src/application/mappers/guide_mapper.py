"""Guide mapper for entity-DTO conversion."""

from src.application.dtos import GuideResponseDTO
from src.domain.entities import Guide


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
            created_by_user_id=guide.created_by_user_id.value if guide.created_by_user_id else None,
            is_public=guide.is_public,
            is_highlighted=guide.is_highlighted,
            created_at=guide.created_at.isoformat(),
            updated_at=guide.updated_at.isoformat(),
        )
