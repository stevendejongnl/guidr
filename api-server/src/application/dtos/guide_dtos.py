"""Guide DTOs for application layer."""

from dataclasses import dataclass
from typing import Optional


@dataclass
class GuideCreateDTO:
    """DTO for creating a guide."""

    category_id: str
    title: str
    description: Optional[str] = None


@dataclass
class GuideUpdateDTO:
    """DTO for updating a guide."""

    title: Optional[str] = None
    description: Optional[str] = None


@dataclass
class GuideResponseDTO:
    """DTO for guide response."""

    id: str
    category_id: str
    title: str
    description: Optional[str]
    step_ids: list[str]
    created_at: str  # ISO format
    updated_at: str  # ISO format
