"""Step timer DTOs for application layer."""

from dataclasses import dataclass


@dataclass
class StepTimerCreateDTO:
    """DTO for creating/starting a step timer."""

    step_id: str
    guide_id: str
    duration_seconds: int  # 0 for stopwatch mode


@dataclass
class StepTimerResponseDTO:
    """DTO for step timer response."""

    id: str
    step_id: str
    guide_id: str
    user_id: str
    status: str
    started_at: str | None  # ISO format
    accumulated_seconds: int
    duration_seconds: int
    created_at: str  # ISO format
    updated_at: str  # ISO format
    server_time: str | None = None  # ISO format, current server time


@dataclass
class ActiveStepTimerResponseDTO(StepTimerResponseDTO):
    """DTO for active step timer with enriched guide/step titles."""

    guide_title: str = ""
    step_title: str = ""
