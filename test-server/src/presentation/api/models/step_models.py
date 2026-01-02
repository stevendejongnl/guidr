"""Step API models."""

from typing import Optional
from pydantic import BaseModel, Field


class StepCreate(BaseModel):
    """Request model for creating a step."""

    guide_id: str = Field(..., alias="guideId")
    order: int
    title: str
    description: Optional[str] = None
    duration: Optional[int] = None  # seconds

    class Config:
        """Pydantic config."""

        populate_by_name = True


class StepUpdate(BaseModel):
    """Request model for updating a step."""

    order: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    duration: Optional[int] = None  # seconds

    class Config:
        """Pydantic config."""

        populate_by_name = True


class StepResponse(BaseModel):
    """Response model for a step."""

    id: str
    guide_id: str = Field(..., alias="guideId")
    order: int
    title: str
    description: Optional[str]
    duration: Optional[int]  # seconds
    created_at: str = Field(..., alias="createdAt")
    updated_at: str = Field(..., alias="updatedAt")

    class Config:
        """Pydantic config."""

        populate_by_name = True
