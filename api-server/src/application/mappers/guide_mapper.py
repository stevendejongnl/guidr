"""Guide mapper for entity-DTO conversion."""

from src.application.dtos import GuideResponseDTO
from src.domain.entities import Guide


class GuideMapper:
    """Mapper for Guide entity to DTOs."""

    @staticmethod
    def to_response_dto(guide: Guide) -> GuideResponseDTO:
        """Convert Guide entity to GuideResponseDTO."""
        return GuideResponseDTO(
            id=guide.id.value,
            guide_type=guide.guide_type.value,
            title=guide.title.value,
            description=guide.description,
            metadata=guide.metadata,
            step_ids=[
                step_id.value
                for step_id in guide.step_ids
            ],
            created_by_user_id=(
                guide.created_by_user_id.value
                if guide.created_by_user_id
                else None
            ),
            is_public=guide.is_public,
            is_highlighted=guide.is_highlighted,
            language=guide.language.value,
            created_at=guide.created_at.isoformat(),
            updated_at=guide.updated_at.isoformat(),
        )
