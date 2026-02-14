"""Guide API models."""

from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class GuideCreate(BaseModel):
    """Request model for creating a guide."""

    guide_type: str = Field(..., alias="guideType")
    title: str
    description: str | None = None
    metadata: dict[str, Any] | None = None
    is_public: bool = Field(default=False, alias="isPublic")
    language: str = "en"

    model_config = ConfigDict(populate_by_name=True)


class GuideUpdate(BaseModel):
    """Request model for updating a guide."""

    title: str | None = None
    description: str | None = None
    metadata: dict[str, Any] | None = None
    is_public: bool | None = Field(
        default=None, alias="isPublic"
    )
    is_highlighted: bool | None = Field(
        default=None, alias="isHighlighted"
    )
    guide_type: str | None = Field(
        default=None, alias="guideType"
    )
    created_by_user_id: str | None = Field(
        default=None, alias="createdByUserId"
    )
    language: str | None = None

    model_config = ConfigDict(populate_by_name=True)


class CopyGuideRequest(BaseModel):
    """Request model for copying a guide to a new language."""

    target_language: str = Field(
        ..., alias="targetLanguage"
    )

    model_config = ConfigDict(populate_by_name=True)


class GuideResponse(BaseModel):
    """Response model for a guide."""

    id: str
    guide_type: str = Field(..., alias="guideType")
    title: str
    description: str | None
    metadata: dict[str, Any] | None = None
    step_ids: list[str] = Field(..., alias="stepIds")
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
