"""Session DTOs for application layer."""

from dataclasses import dataclass
from typing import Optional


@dataclass
class SessionCreateDTO:
    """DTO for creating a session."""

    guide_id: str


@dataclass
class SessionUpdateDTO:
    """DTO for updating a session."""

    current_step_id: Optional[str] = None


@dataclass
class SessionResponseDTO:
    """DTO for session response."""

    id: str
    guide_id: str
    status: str  # SessionStatus enum value
    started_at: Optional[str]  # ISO format
    completed_at: Optional[str]  # ISO format
    current_step_id: Optional[str]
    created_at: str  # ISO format
    updated_at: str  # ISO format
