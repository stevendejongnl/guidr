"""Generate guide use case."""

from src.application.dtos.generation_dtos import (
    GeneratedGuideDTO,
    GenerateGuideDTO,
)
from src.domain.value_objects import GuideType
from src.infrastructure.ai.llm_service import LLMService


class GenerateGuide:
    """Use case for generating a guide via AI."""

    def __init__(self, llm_service: LLMService):
        self._llm_service = llm_service

    async def execute(
        self, dto: GenerateGuideDTO
    ) -> GeneratedGuideDTO:
        """Generate a guide from a text prompt.

        Args:
            dto: Generation request with prompt

        Returns:
            Generated guide draft

        Raises:
            ValueError: If guide_type is invalid
            LLMServiceError: If AI generation fails
        """
        if dto.guide_type:
            GuideType(dto.guide_type)  # validates

        return await self._llm_service.generate_guide(
            prompt=dto.prompt,
            guide_type=dto.guide_type,
            language=dto.language,
        )
