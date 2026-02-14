"""Tests for GenerateGuide use case."""

import pytest

from src.application.dtos.generation_dtos import (
    GeneratedGuideDTO,
    GeneratedStepDTO,
    GenerateGuideDTO,
)
from src.application.use_cases.guide import GenerateGuide
from src.infrastructure.ai.llm_service import LLMService


class MockLLMService(LLMService):
    """Mock LLM service for testing."""

    def __init__(
        self, result: GeneratedGuideDTO | None = None
    ):
        self._result = result or GeneratedGuideDTO(
            guide_type="general",
            title="Test Guide",
            steps=[
                GeneratedStepDTO(order=1, title="Step 1")
            ],
        )
        self.last_prompt: str | None = None
        self.last_guide_type: str | None = None
        self.last_language: str | None = None

    async def generate_guide(
        self,
        prompt: str,
        guide_type: str | None = None,
        language: str = "en",
    ) -> GeneratedGuideDTO:
        self.last_prompt = prompt
        self.last_guide_type = guide_type
        self.last_language = language
        return self._result

    async def translate_guide(
        self,
        guide_title: str,
        guide_description: str | None,
        steps: list[dict[str, object]],
        metadata: dict[str, object] | None,
        guide_type: str,
        target_language: str,
    ) -> GeneratedGuideDTO:
        raise NotImplementedError


class TestGenerateGuide:
    """Tests for GenerateGuide use case."""

    @pytest.mark.asyncio
    async def test_generates_guide_from_prompt(self):
        mock_llm = MockLLMService()
        use_case = GenerateGuide(llm_service=mock_llm)

        dto = GenerateGuideDTO(prompt="bread baking guide")
        result = await use_case.execute(dto)

        assert result.title == "Test Guide"
        assert mock_llm.last_prompt == "bread baking guide"
        assert mock_llm.last_guide_type is None

    @pytest.mark.asyncio
    async def test_passes_guide_type_to_llm(self):
        mock_llm = MockLLMService()
        use_case = GenerateGuide(llm_service=mock_llm)

        dto = GenerateGuideDTO(
            prompt="bread baking", guide_type="cooking"
        )
        await use_case.execute(dto)

        assert mock_llm.last_guide_type == "cooking"

    @pytest.mark.asyncio
    async def test_rejects_invalid_guide_type(self):
        mock_llm = MockLLMService()
        use_case = GenerateGuide(llm_service=mock_llm)

        dto = GenerateGuideDTO(
            prompt="test", guide_type="invalid"
        )
        with pytest.raises(ValueError):
            await use_case.execute(dto)

    @pytest.mark.asyncio
    async def test_allows_none_guide_type(self):
        mock_llm = MockLLMService()
        use_case = GenerateGuide(llm_service=mock_llm)

        dto = GenerateGuideDTO(
            prompt="any guide", guide_type=None
        )
        result = await use_case.execute(dto)

        assert result.title == "Test Guide"

    @pytest.mark.asyncio
    async def test_passes_language_to_llm(self):
        mock_llm = MockLLMService()
        use_case = GenerateGuide(llm_service=mock_llm)

        dto = GenerateGuideDTO(
            prompt="Dutch bread guide", language="nl"
        )
        await use_case.execute(dto)

        assert mock_llm.last_language == "nl"

    @pytest.mark.asyncio
    async def test_defaults_language_to_english(self):
        mock_llm = MockLLMService()
        use_case = GenerateGuide(llm_service=mock_llm)

        dto = GenerateGuideDTO(prompt="bread guide")
        await use_case.execute(dto)

        assert mock_llm.last_language == "en"
