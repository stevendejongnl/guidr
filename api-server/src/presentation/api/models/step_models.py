"""Step API models."""


from pydantic import BaseModel, ConfigDict, Field


class StepCreate(BaseModel):
    """Request model for creating a step."""

    guide_id: str = Field(..., alias="guideId")
    order: int
    title: str
    description: str | None = None
    duration: int | None = None  # seconds

    model_config = ConfigDict(populate_by_name=True)


class StepUpdate(BaseModel):
    """Request model for updating a step."""

    order: int | None = None
    title: str | None = None
    description: str | None = None
    duration: int | None = None  # seconds

    model_config = ConfigDict(populate_by_name=True)


class StepResponse(BaseModel):
    """Response model for a step."""

    id: str
    guide_id: str = Field(..., alias="guideId")
    order: int
    title: str
    description: str | None
    duration: int | None  # seconds
    created_at: str = Field(..., alias="createdAt")
    updated_at: str = Field(..., alias="updatedAt")

    model_config = ConfigDict(populate_by_name=True)
