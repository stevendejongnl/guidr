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

    async def generate_guide(
        self,
        prompt: str,
        guide_type: str | None = None,
    ) -> GeneratedGuideDTO:
        self.last_prompt = prompt
        self.last_guide_type = guide_type
        return self._result


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
