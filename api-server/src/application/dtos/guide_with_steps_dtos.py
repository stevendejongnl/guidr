"""DTOs for batch guide + steps creation."""

from dataclasses import dataclass, field
from typing import Any


@dataclass
class StepInput:
    """DTO for a step within batch creation."""

    order: int
    title: str
    description: str | None = None
    duration: int | None = None  # seconds


@dataclass
class CreateGuideWithStepsDTO:
    """DTO for creating a guide with its steps atomically."""

    guide_type: str
    title: str
    description: str | None = None
    metadata: dict[str, Any] | None = None
    is_public: bool = False
    language: str = "en"
    steps: list[StepInput] = field(default_factory=list)
