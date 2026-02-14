"""OpenAI-based LLM service for guide generation."""

import json
import logging

from openai import AsyncOpenAI, OpenAIError

from src.application.dtos.generation_dtos import (
    GeneratedGuideDTO,
    GeneratedStepDTO,
)
from src.infrastructure.config.settings import Settings

from .llm_service import LLMNotConfiguredError, LLMService, LLMServiceError

SYSTEM_PROMPT = """You are a guide creation assistant. Generate structured guides with steps.

Available guide types and their metadata:
- "cooking": metadata has "ingredients" (list of {name, quantity, unit})
- "workout": metadata has "target_muscles" (list of {name, focus})
  and "equipment" (list of {name, weight})
- "general": metadata has "notes" (list of {key, value})

Respond with valid JSON matching this schema:
{
  "guide_type": "cooking" | "workout" | "general",
  "title": "string",
  "description": "string or null",
  "metadata": { ... type-specific metadata ... },
  "steps": [
    {
      "order": 1,
      "title": "string",
      "description": "string or null",
      "duration": number_or_null (in minutes)
    }
  ]
}

Rules:
- Choose the most appropriate guide_type based on the content
- If a guide_type is specified by the user, use that type
- Generate 3-10 steps with clear, actionable titles
- Include realistic durations in minutes where applicable
- Metadata must conform to the schema for the chosen type
- All metadata item fields must be strings"""


class OpenAILLMService(LLMService):
    """LLM service implementation using OpenAI."""

    def __init__(self, settings: Settings):
        self._api_key = settings.openai_api_key
        self._model = settings.openai_model
        self._max_tokens = settings.openai_max_tokens
        self._logger = logging.getLogger(__name__)

        if not self._api_key:
            self._logger.warning(
                "OpenAI API key not configured, "
                "guide generation will be unavailable"
            )

    async def generate_guide(
        self,
        prompt: str,
        guide_type: str | None = None,
    ) -> GeneratedGuideDTO:
        """Generate a guide using OpenAI."""
        if not self._api_key:
            raise LLMNotConfiguredError(
                "OpenAI API key not configured. "
                "Set OPENAI_API_KEY environment variable."
            )

        user_message = prompt
        if guide_type:
            user_message = (
                f"[Guide type: {guide_type}] {prompt}"
            )

        try:
            client = AsyncOpenAI(api_key=self._api_key)
            response = await client.chat.completions.create(
                model=self._model,
                max_tokens=self._max_tokens,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_message},
                ],
            )

            content = response.choices[0].message.content
            if not content:
                raise LLMServiceError(
                    "Empty response from OpenAI"
                )

            return self._parse_response(content)
        except OpenAIError as e:
            self._logger.error(f"OpenAI API error: {e}")
            raise LLMServiceError(
                f"AI generation failed: {e}"
            ) from e

    def _parse_response(
        self, content: str
    ) -> GeneratedGuideDTO:
        """Parse JSON response into GeneratedGuideDTO."""
        try:
            data = json.loads(content)
        except json.JSONDecodeError as e:
            raise LLMServiceError(
                f"Invalid JSON from AI: {e}"
            ) from e

        steps = [
            GeneratedStepDTO(
                order=s.get("order", i + 1),
                title=s["title"],
                description=s.get("description"),
                duration=s.get("duration"),
            )
            for i, s in enumerate(data.get("steps", []))
        ]

        return GeneratedGuideDTO(
            guide_type=data.get("guide_type", "general"),
            title=data.get("title", "Untitled Guide"),
            description=data.get("description"),
            metadata=data.get("metadata"),
            steps=steps,
        )
