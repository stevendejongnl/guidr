"""Step DTOs for application layer."""

from dataclasses import dataclass


@dataclass
class StepCreateDTO:
    """DTO for creating a step."""

    guide_id: str
    order: int
    title: str
    description: str | None = None
    duration: int | None = None  # seconds


@dataclass
class StepUpdateDTO:
    """DTO for updating a step."""

    order: int | None = None
    title: str | None = None
    description: str | None = None
    duration: int | None = None  # seconds


@dataclass
class StepResponseDTO:
    """DTO for step response."""

    id: str
    guide_id: str
    order: int
    title: str
    description: str | None
    duration: int | None  # seconds
    created_at: str  # ISO format
    updated_at: str  # ISO format
