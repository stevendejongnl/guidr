"""Step timer API models."""

from pydantic import BaseModel, ConfigDict, Field


class StepTimerStart(BaseModel):
    """Request model for starting a step timer."""

    step_id: str = Field(..., alias="stepId")
    guide_id: str = Field(..., alias="guideId")
    duration_seconds: int = Field(..., alias="durationSeconds")

    model_config = ConfigDict(populate_by_name=True)


class StepTimerResponse(BaseModel):
    """Response model for a step timer."""

    id: str
    step_id: str = Field(..., alias="stepId")
    guide_id: str = Field(..., alias="guideId")
    user_id: str = Field(..., alias="userId")
    status: str
    started_at: str | None = Field(None, alias="startedAt")
    accumulated_seconds: int = Field(
        ..., alias="accumulatedSeconds"
    )
    duration_seconds: int = Field(..., alias="durationSeconds")
    remaining_seconds: int | None = Field(None, alias="remainingSeconds")
    created_at: str = Field(..., alias="createdAt")
    updated_at: str = Field(..., alias="updatedAt")
    server_time: str | None = Field(None, alias="serverTime")

    model_config = ConfigDict(populate_by_name=True)


class ActiveStepTimerResponse(StepTimerResponse):
    """Response model for active timer with guide/step titles."""

    guide_title: str = Field(..., alias="guideTitle")
    step_title: str = Field(..., alias="stepTitle")
