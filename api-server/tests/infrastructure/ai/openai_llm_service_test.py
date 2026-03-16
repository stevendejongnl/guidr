"""Tests for OpenAI LLM service."""

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.infrastructure.ai.llm_service import (
    LLMNotConfiguredError,
    LLMServiceError,
)
from src.infrastructure.ai.openai_llm_service import OpenAILLMService
from src.infrastructure.config.settings import Settings


def _make_settings(
    api_key: str | None = "test-key",
) -> Settings:
    """Create test settings with real Settings object."""
    return Settings(
        openai_api_key=api_key,
        openai_model="gpt-4o",
        openai_max_tokens=4096,
    )


def _mock_response(content: dict) -> MagicMock:
    """Create a mock OpenAI response."""
    message = MagicMock()
    message.content = json.dumps(content)
    choice = MagicMock()
    choice.message = message
    response = MagicMock()
    response.choices = [choice]
    return response


VALID_GUIDE_RESPONSE = {
    "guide_type": "cooking",
    "title": "Bread Baking Guide",
    "description": "A simple bread recipe",
    "metadata": {
        "ingredients": [
            {"name": "flour", "quantity": "500", "unit": "g"},
            {"name": "water", "quantity": "300", "unit": "ml"},
        ]
    },
    "steps": [
        {
            "order": 1,
            "title": "Mix ingredients",
            "description": "Combine flour and water",
            "duration": 10,
        },
        {
            "order": 2,
            "title": "Knead dough",
            "description": "Knead for 10 minutes",
            "duration": 10,
        },
    ],
}


class TestOpenAILLMServiceMissingKey:
    """Tests for missing API key behavior."""

    @pytest.mark.asyncio
    async def test_raises_not_configured_when_no_key(self):
        service = OpenAILLMService(_make_settings(api_key=None))
        with pytest.raises(LLMNotConfiguredError):
            await service.generate_guide("bread baking")

    @pytest.mark.asyncio
    async def test_raises_not_configured_when_empty_key(self):
        service = OpenAILLMService(_make_settings(api_key=""))
        with pytest.raises(LLMNotConfiguredError):
            await service.generate_guide("bread baking")


class TestOpenAILLMServiceParsing:
    """Tests for response parsing."""

    @pytest.mark.asyncio
    async def test_parses_valid_response(self):
        service = OpenAILLMService(_make_settings())
        mock_resp = _mock_response(VALID_GUIDE_RESPONSE)

        with patch(
            "src.infrastructure.ai.openai_llm_service.AsyncOpenAI"
        ) as mock_cls:
            mock_client = AsyncMock()
            mock_client.chat.completions.create = AsyncMock(
                return_value=mock_resp
            )
            mock_cls.return_value = mock_client

            result = await service.generate_guide(
                "bread baking"
            )

        assert result.guide_type == "cooking"
        assert result.title == "Bread Baking Guide"
        assert result.description == "A simple bread recipe"
        assert len(result.steps) == 2
        assert result.steps[0].title == "Mix ingredients"
        assert result.steps[0].duration == 10
        assert result.steps[1].order == 2

    @pytest.mark.asyncio
    async def test_includes_guide_type_in_prompt(self):
        service = OpenAILLMService(_make_settings())
        mock_resp = _mock_response(VALID_GUIDE_RESPONSE)

        with patch(
            "src.infrastructure.ai.openai_llm_service.AsyncOpenAI"
        ) as mock_cls:
            mock_client = AsyncMock()
            mock_client.chat.completions.create = AsyncMock(
                return_value=mock_resp
            )
            mock_cls.return_value = mock_client

            await service.generate_guide(
                "bread baking", guide_type="cooking"
            )

            call_args = (
                mock_client.chat.completions.create.call_args
            )
            messages = call_args.kwargs["messages"]
            user_msg = messages[1]["content"]
            assert "[Guide type: cooking]" in user_msg

    @pytest.mark.asyncio
    async def test_handles_empty_response(self):
        service = OpenAILLMService(_make_settings())
        message = MagicMock()
        message.content = None
        choice = MagicMock()
        choice.message = message
        response = MagicMock()
        response.choices = [choice]

        with patch(
            "src.infrastructure.ai.openai_llm_service.AsyncOpenAI"
        ) as mock_cls:
            mock_client = AsyncMock()
            mock_client.chat.completions.create = AsyncMock(
                return_value=response
            )
            mock_cls.return_value = mock_client

            with pytest.raises(LLMServiceError, match="Empty"):
                await service.generate_guide("test")

    @pytest.mark.asyncio
    async def test_handles_invalid_json(self):
        service = OpenAILLMService(_make_settings())
        message = MagicMock()
        message.content = "not valid json"
        choice = MagicMock()
        choice.message = message
        response = MagicMock()
        response.choices = [choice]

        with patch(
            "src.infrastructure.ai.openai_llm_service.AsyncOpenAI"
        ) as mock_cls:
            mock_client = AsyncMock()
            mock_client.chat.completions.create = AsyncMock(
                return_value=response
            )
            mock_cls.return_value = mock_client

            with pytest.raises(LLMServiceError, match="Invalid JSON"):
                await service.generate_guide("test")

    @pytest.mark.asyncio
    async def test_handles_minimal_response(self):
        """Response with missing optional fields."""
        service = OpenAILLMService(_make_settings())
        minimal = {
            "title": "Quick Guide",
            "steps": [{"title": "Step 1"}],
        }
        mock_resp = _mock_response(minimal)

        with patch(
            "src.infrastructure.ai.openai_llm_service.AsyncOpenAI"
        ) as mock_cls:
            mock_client = AsyncMock()
            mock_client.chat.completions.create = AsyncMock(
                return_value=mock_resp
            )
            mock_cls.return_value = mock_client

            result = await service.generate_guide("test")

        assert result.guide_type == "general"
        assert result.title == "Quick Guide"
        assert result.description is None
        assert len(result.steps) == 1
        assert result.steps[0].order == 1


TRANSLATED_GUIDE_RESPONSE = {
    "guide_type": "cooking",
    "title": "Brood Bakken",
    "description": "Een simpel brood recept",
    "metadata": {
        "ingredients": [
            {"name": "bloem", "quantity": "500", "unit": "g"},
        ]
    },
    "steps": [
        {
            "order": 1,
            "title": "Meng ingredienten",
            "description": "Meng bloem en water",
            "duration": 10,
        },
    ],
}


class TestOpenAILLMServiceTranslate:
    """Tests for translate_guide method."""

    @pytest.mark.asyncio
    async def test_raises_not_configured_when_no_key(self):
        service = OpenAILLMService(
            _make_settings(api_key=None)
        )
        with pytest.raises(LLMNotConfiguredError):
            await service.translate_guide(
                guide_title="Test",
                guide_description=None,
                steps=[],
                metadata=None,
                guide_type="general",
                target_language="nl",
            )

    @pytest.mark.asyncio
    async def test_parses_translated_response(self):
        service = OpenAILLMService(_make_settings())
        mock_resp = _mock_response(
            TRANSLATED_GUIDE_RESPONSE
        )

        with patch(
            "src.infrastructure.ai"
            ".openai_llm_service.AsyncOpenAI"
        ) as mock_cls:
            mock_client = AsyncMock()
            mock_client.chat.completions.create = (
                AsyncMock(return_value=mock_resp)
            )
            mock_cls.return_value = mock_client

            result = await service.translate_guide(
                guide_title="Bread Baking",
                guide_description="A simple recipe",
                steps=[
                    {
                        "order": 1,
                        "title": "Mix",
                        "duration": 10,
                    }
                ],
                metadata=None,
                guide_type="cooking",
                target_language="nl",
            )

        assert result.title == "Brood Bakken"
        assert result.guide_type == "cooking"
        assert len(result.steps) == 1
        assert result.steps[0].title == "Meng ingredienten"

    @pytest.mark.asyncio
    async def test_includes_target_language_in_prompt(self):
        service = OpenAILLMService(_make_settings())
        mock_resp = _mock_response(
            TRANSLATED_GUIDE_RESPONSE
        )

        with patch(
            "src.infrastructure.ai"
            ".openai_llm_service.AsyncOpenAI"
        ) as mock_cls:
            mock_client = AsyncMock()
            mock_client.chat.completions.create = (
                AsyncMock(return_value=mock_resp)
            )
            mock_cls.return_value = mock_client

            await service.translate_guide(
                guide_title="Bread Baking",
                guide_description=None,
                steps=[],
                metadata=None,
                guide_type="cooking",
                target_language="nl",
            )

            call_args = (
                mock_client.chat.completions.create
                .call_args
            )
            messages = call_args.kwargs["messages"]
            user_msg = messages[1]["content"]
            assert "'nl'" in user_msg

    @pytest.mark.asyncio
    async def test_handles_empty_translate_response(self):
        service = OpenAILLMService(_make_settings())
        message = MagicMock()
        message.content = None
        choice = MagicMock()
        choice.message = message
        response = MagicMock()
        response.choices = [choice]

        with patch(
            "src.infrastructure.ai"
            ".openai_llm_service.AsyncOpenAI"
        ) as mock_cls:
            mock_client = AsyncMock()
            mock_client.chat.completions.create = (
                AsyncMock(return_value=response)
            )
            mock_cls.return_value = mock_client

            with pytest.raises(
                LLMServiceError, match="Empty"
            ):
                await service.translate_guide(
                    guide_title="Test",
                    guide_description=None,
                    steps=[],
                    metadata=None,
                    guide_type="general",
                    target_language="nl",
                )
