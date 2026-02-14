"""Generate guide from URL use case."""

from src.application.dtos.generation_dtos import (
    GeneratedGuideDTO,
    GenerateGuideFromUrlDTO,
)
from src.domain.value_objects import GuideType
from src.infrastructure.ai.llm_service import LLMService
from src.infrastructure.ai.url_content_extractor import (
    UrlContentExtractor,
)


class GenerateGuideFromUrl:
    """Use case for generating a guide from URL content."""

    def __init__(
        self,
        llm_service: LLMService,
        url_content_extractor: UrlContentExtractor,
    ):
        self._llm_service = llm_service
        self._url_extractor = url_content_extractor

    async def execute(
        self, dto: GenerateGuideFromUrlDTO
    ) -> GeneratedGuideDTO:
        """Generate a guide from URL content.

        Args:
            dto: Generation request with URL

        Returns:
            Generated guide draft

        Raises:
            ValueError: If guide_type is invalid
            UrlExtractionError: If URL fetch fails
            LLMServiceError: If AI generation fails
        """
        if dto.guide_type:
            GuideType(dto.guide_type)  # validates

        content = await self._url_extractor.extract(dto.url)

        prompt = (
            f"Create a guide based on this content "
            f"from {dto.url}:\n\n{content}"
        )

        return await self._llm_service.generate_guide(
            prompt=prompt,
            guide_type=dto.guide_type,
            language=dto.language,
        )
