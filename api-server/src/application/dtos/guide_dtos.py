"""Guide DTOs for application layer."""

from dataclasses import dataclass
from typing import Any


@dataclass
class GuideCreateDTO:
    """DTO for creating a guide."""

    guide_type: str
    title: str
    description: str | None = None
    metadata: dict[str, Any] | None = None
    is_public: bool = False
    language: str = "en"


@dataclass
class GuideUpdateDTO:
    """DTO for updating a guide."""

    title: str | None = None
    description: str | None = None
    metadata: dict[str, Any] | None = None
    is_public: bool | None = None
    is_highlighted: bool | None = None
    guide_type: str | None = None
    created_by_user_id: str | None = None
    language: str | None = None


@dataclass
class CopyGuideDTO:
    """DTO for copying a guide to a new language."""

    source_guide_id: str
    target_language: str


@dataclass
class GuideResponseDTO:
    """DTO for guide response."""

    id: str
    guide_type: str
    title: str
    description: str | None
    metadata: dict[str, Any] | None
    step_ids: list[str]
    created_by_user_id: str | None
    is_public: bool
    is_highlighted: bool
    created_at: str  # ISO format
    updated_at: str  # ISO format
    language: str = "en"
    total_duration: int | None = None
    created_by_name: str | None = None
