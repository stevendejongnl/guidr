"""Session API models."""


from pydantic import BaseModel, ConfigDict, Field


class SessionCreate(BaseModel):
    """Request model for creating a session."""

    guide_id: str = Field(..., alias="guideId")

    model_config = ConfigDict(populate_by_name=True)


class SessionResponse(BaseModel):
    """Response model for a session."""

    id: str
    guide_id: str = Field(..., alias="guideId")
    status: str
    started_at: str | None = Field(None, alias="startedAt")
    completed_at: str | None = Field(None, alias="completedAt")
    current_step_id: str | None = Field(None, alias="currentStepId")
    created_at: str = Field(..., alias="createdAt")
    updated_at: str = Field(..., alias="updatedAt")

    model_config = ConfigDict(populate_by_name=True)


class MoveToStepRequest(BaseModel):
    """Request model for moving session to a step."""

    step_id: str = Field(..., alias="stepId")

    model_config = ConfigDict(populate_by_name=True)
