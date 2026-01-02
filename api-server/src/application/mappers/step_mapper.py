"""Step mapper for entity-DTO conversion."""

from src.domain.entities import Step
from src.application.dtos import StepResponseDTO


class StepMapper:
    """Mapper for Step entity to DTOs."""

    @staticmethod
    def to_response_dto(step: Step) -> StepResponseDTO:
        """Convert Step entity to StepResponseDTO.

        Args:
            step: Step entity

        Returns:
            StepResponseDTO with all step data
        """
        return StepResponseDTO(
            id=step.id.value,
            guide_id=step.guide_id.value,
            order=step.order,
            title=step.title,
            description=step.description,
            duration=step.duration.value if step.duration else None,
            created_at=step.created_at.isoformat(),
            updated_at=step.updated_at.isoformat(),
        )
