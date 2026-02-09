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


@dataclass
class GuideUpdateDTO:
    """DTO for updating a guide."""

    title: str | None = None
    description: str | None = None
    metadata: dict[str, Any] | None = None
    is_public: bool | None = None
    is_highlighted: bool | None = None


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
