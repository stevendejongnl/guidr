"""Session API models."""

from typing import Optional
from pydantic import BaseModel, Field


class SessionCreate(BaseModel):
    """Request model for creating a session."""

    guide_id: str = Field(..., alias="guideId")

    class Config:
        """Pydantic config."""

        populate_by_name = True


class SessionResponse(BaseModel):
    """Response model for a session."""

    id: str
    guide_id: str = Field(..., alias="guideId")
    status: str
    started_at: Optional[str] = Field(None, alias="startedAt")
    completed_at: Optional[str] = Field(None, alias="completedAt")
    current_step_id: Optional[str] = Field(None, alias="currentStepId")
    created_at: str = Field(..., alias="createdAt")
    updated_at: str = Field(..., alias="updatedAt")

    class Config:
        """Pydantic config."""

        populate_by_name = True


class MoveToStepRequest(BaseModel):
    """Request model for moving session to a step."""

    step_id: str = Field(..., alias="stepId")

    class Config:
        """Pydantic config."""

        populate_by_name = True
