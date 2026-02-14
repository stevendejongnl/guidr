"""Generation API models."""

from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class GenerateGuideRequest(BaseModel):
    """Request for generating a guide from a prompt."""

    prompt: str = Field(..., max_length=1000)
    guide_type: str | None = Field(
        default=None, alias="guideType"
    )
    language: str = "en"

    model_config = ConfigDict(populate_by_name=True)


class GenerateGuideFromUrlRequest(BaseModel):
    """Request for generating a guide from a URL."""

    url: str
    guide_type: str | None = Field(
        default=None, alias="guideType"
    )
    language: str = "en"

    model_config = ConfigDict(populate_by_name=True)


class GeneratedStepResponse(BaseModel):
    """Response for a generated step."""

    order: int
    title: str
    description: str | None = None
    duration: int | None = None  # minutes

    model_config = ConfigDict(populate_by_name=True)


class GeneratedGuideResponse(BaseModel):
    """Response for a generated guide draft."""

    guide_type: str = Field(..., alias="guideType")
    title: str
    description: str | None = None
    metadata: dict[str, Any] | None = None
    steps: list[GeneratedStepResponse] = []

    model_config = ConfigDict(populate_by_name=True)


class StepInputModel(BaseModel):
    """Input for a step in batch creation."""

    order: int
    title: str
    description: str | None = None
    duration: int | None = None  # seconds

    model_config = ConfigDict(populate_by_name=True)


class CreateGuideWithStepsRequest(BaseModel):
    """Request for creating guide + steps atomically."""

    guide_type: str = Field(..., alias="guideType")
    title: str
    description: str | None = None
    metadata: dict[str, Any] | None = None
    is_public: bool = Field(default=False, alias="isPublic")
    language: str = "en"
    steps: list[StepInputModel] = []

    model_config = ConfigDict(populate_by_name=True)


class GuideWithStepsResponse(BaseModel):
    """Response for guide + steps batch creation."""

    guide: "GuideResponseRef"
    steps: list["StepResponseRef"]

    model_config = ConfigDict(populate_by_name=True)


class GuideResponseRef(BaseModel):
    """Guide in combined response (same as GuideResponse)."""

    id: str
    guide_type: str = Field(..., alias="guideType")
    title: str
    description: str | None
    metadata: dict[str, Any] | None = None
    step_ids: list[str] = Field(
        default_factory=list, alias="stepIds"
    )
    created_by_user_id: str | None = Field(
        default=None, alias="createdByUserId"
    )
    is_public: bool = Field(..., alias="isPublic")
    is_highlighted: bool = Field(
        ..., alias="isHighlighted"
    )
    language: str = "en"
    created_at: str = Field(..., alias="createdAt")
    updated_at: str = Field(..., alias="updatedAt")

    model_config = ConfigDict(populate_by_name=True)


class StepResponseRef(BaseModel):
    """Step in combined response (same as StepResponse)."""

    id: str
    guide_id: str = Field(..., alias="guideId")
    order: int
    title: str
    description: str | None
    duration: int | None  # seconds
    created_at: str = Field(..., alias="createdAt")
    updated_at: str = Field(..., alias="updatedAt")

    model_config = ConfigDict(populate_by_name=True)
