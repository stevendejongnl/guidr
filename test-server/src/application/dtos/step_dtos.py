"""Step DTOs for application layer."""

from dataclasses import dataclass
from typing import Optional


@dataclass
class StepCreateDTO:
    """DTO for creating a step."""

    guide_id: str
    order: int
    title: str
    description: Optional[str] = None
    duration: Optional[int] = None  # seconds


@dataclass
class StepUpdateDTO:
    """DTO for updating a step."""

    order: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    duration: Optional[int] = None  # seconds


@dataclass
class StepResponseDTO:
    """DTO for step response."""

    id: str
    guide_id: str
    order: int
    title: str
    description: Optional[str]
    duration: Optional[int]  # seconds
    created_at: str  # ISO format
    updated_at: str  # ISO format
