"""Abstract LLM service interface."""

from abc import ABC, abstractmethod

from src.application.dtos.generation_dtos import GeneratedGuideDTO


class LLMService(ABC):
    """Abstract base class for LLM-based guide generation."""

    @abstractmethod
    async def generate_guide(
        self,
        prompt: str,
        guide_type: str | None = None,
        language: str = "en",
    ) -> GeneratedGuideDTO:
        """Generate a guide from a text prompt.

        Args:
            prompt: User prompt describing the guide
            guide_type: Optional guide type hint
            language: ISO 639-1 language code for content generation

        Returns:
            Generated guide with steps

        Raises:
            LLMServiceError: If the LLM call fails
        """
        pass


class LLMServiceError(Exception):
    """Raised when an LLM service call fails."""

    pass


class LLMNotConfiguredError(LLMServiceError):
    """Raised when LLM credentials are not configured."""

    pass
