"""Tests for GenerateGuideFromUrl use case."""

import pytest

from src.application.dtos.generation_dtos import (
    GeneratedGuideDTO,
    GeneratedStepDTO,
    GenerateGuideFromUrlDTO,
)
from src.application.use_cases.guide import GenerateGuideFromUrl
from src.infrastructure.ai.llm_service import LLMService
from src.infrastructure.ai.url_content_extractor import (
    UrlContentExtractor,
    UrlExtractionError,
)


class MockLLMService(LLMService):
    """Mock LLM service for testing."""

    def __init__(self):
        self._result = GeneratedGuideDTO(
            guide_type="cooking",
            title="Recipe Guide",
            steps=[
                GeneratedStepDTO(order=1, title="Step 1")
            ],
        )
        self.last_prompt: str | None = None
        self.last_language: str | None = None

    async def generate_guide(
        self,
        prompt: str,
        guide_type: str | None = None,
        language: str = "en",
    ) -> GeneratedGuideDTO:
        self.last_prompt = prompt
        self.last_language = language
        return self._result


class MockUrlExtractor(UrlContentExtractor):
    """Mock URL extractor for testing."""

    def __init__(
        self,
        content: str = "Recipe content here",
        error: Exception | None = None,
    ):
        self._content = content
        self._error = error
        self.last_url: str | None = None

    async def extract(self, url: str) -> str:
        self.last_url = url
        if self._error:
            raise self._error
        return self._content


class TestGenerateGuideFromUrl:
    """Tests for GenerateGuideFromUrl use case."""

    @pytest.mark.asyncio
    async def test_fetches_url_and_generates_guide(self):
        mock_llm = MockLLMService()
        mock_extractor = MockUrlExtractor(
            content="Recipe for bread"
        )
        use_case = GenerateGuideFromUrl(
            llm_service=mock_llm,
            url_content_extractor=mock_extractor,
        )

        dto = GenerateGuideFromUrlDTO(
            url="https://example.com/recipe"
        )
        result = await use_case.execute(dto)

        assert result.title == "Recipe Guide"
        assert mock_extractor.last_url == "https://example.com/recipe"
        assert "Recipe for bread" in (
            mock_llm.last_prompt or ""
        )

    @pytest.mark.asyncio
    async def test_includes_url_in_prompt(self):
        mock_llm = MockLLMService()
        mock_extractor = MockUrlExtractor()
        use_case = GenerateGuideFromUrl(
            llm_service=mock_llm,
            url_content_extractor=mock_extractor,
        )

        dto = GenerateGuideFromUrlDTO(
            url="https://example.com/recipe"
        )
        await use_case.execute(dto)

        assert "example.com/recipe" in (
            mock_llm.last_prompt or ""
        )

    @pytest.mark.asyncio
    async def test_propagates_url_extraction_error(self):
        mock_llm = MockLLMService()
        mock_extractor = MockUrlExtractor(
            error=UrlExtractionError("timeout")
        )
        use_case = GenerateGuideFromUrl(
            llm_service=mock_llm,
            url_content_extractor=mock_extractor,
        )

        dto = GenerateGuideFromUrlDTO(
            url="https://example.com"
        )
        with pytest.raises(UrlExtractionError):
            await use_case.execute(dto)

    @pytest.mark.asyncio
    async def test_rejects_invalid_guide_type(self):
        mock_llm = MockLLMService()
        mock_extractor = MockUrlExtractor()
        use_case = GenerateGuideFromUrl(
            llm_service=mock_llm,
            url_content_extractor=mock_extractor,
        )

        dto = GenerateGuideFromUrlDTO(
            url="https://example.com",
            guide_type="invalid",
        )
        with pytest.raises(ValueError):
            await use_case.execute(dto)

    @pytest.mark.asyncio
    async def test_passes_language_to_llm(self):
        mock_llm = MockLLMService()
        mock_extractor = MockUrlExtractor()
        use_case = GenerateGuideFromUrl(
            llm_service=mock_llm,
            url_content_extractor=mock_extractor,
        )

        dto = GenerateGuideFromUrlDTO(
            url="https://example.com/recept",
            language="nl",
        )
        await use_case.execute(dto)

        assert mock_llm.last_language == "nl"

    @pytest.mark.asyncio
    async def test_defaults_language_to_english(self):
        mock_llm = MockLLMService()
        mock_extractor = MockUrlExtractor()
        use_case = GenerateGuideFromUrl(
            llm_service=mock_llm,
            url_content_extractor=mock_extractor,
        )

        dto = GenerateGuideFromUrlDTO(
            url="https://example.com/recipe",
        )
        await use_case.execute(dto)

        assert mock_llm.last_language == "en"
