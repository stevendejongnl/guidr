"""DTOs for AI guide generation."""

from dataclasses import dataclass, field
from typing import Any


@dataclass
class GenerateGuideDTO:
    """DTO for generating a guide from a text prompt."""

    prompt: str
    guide_type: str | None = None


@dataclass
class GenerateGuideFromUrlDTO:
    """DTO for generating a guide from a URL."""

    url: str
    guide_type: str | None = None


@dataclass
class GeneratedStepDTO:
    """DTO for a generated step (AI output)."""

    order: int
    title: str
    description: str | None = None
    duration: int | None = None  # minutes


@dataclass
class GeneratedGuideDTO:
    """DTO for a generated guide (AI output)."""

    guide_type: str
    title: str
    description: str | None = None
    metadata: dict[str, Any] | None = None
    steps: list[GeneratedStepDTO] = field(
        default_factory=list
    )
