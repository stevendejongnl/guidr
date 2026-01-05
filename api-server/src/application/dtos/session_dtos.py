"""Session DTOs for application layer."""

from dataclasses import dataclass


@dataclass
class SessionCreateDTO:
    """DTO for creating a session."""

    guide_id: str


@dataclass
class SessionUpdateDTO:
    """DTO for updating a session."""

    current_step_id: str | None = None


@dataclass
class SessionResponseDTO:
    """DTO for session response."""

    id: str
    guide_id: str
    status: str  # SessionStatus enum value
    started_at: str | None  # ISO format
    completed_at: str | None  # ISO format
    current_step_id: str | None
    created_at: str  # ISO format
    updated_at: str  # ISO format
