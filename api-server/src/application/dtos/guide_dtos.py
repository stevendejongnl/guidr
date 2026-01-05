"""Guide DTOs for application layer."""

from dataclasses import dataclass


@dataclass
class GuideCreateDTO:
    """DTO for creating a guide."""

    category_id: str
    title: str
    description: str | None = None


@dataclass
class GuideUpdateDTO:
    """DTO for updating a guide."""

    title: str | None = None
    description: str | None = None


@dataclass
class GuideResponseDTO:
    """DTO for guide response."""

    id: str
    category_id: str
    title: str
    description: str | None
    step_ids: list[str]
    created_at: str  # ISO format
    updated_at: str  # ISO format
