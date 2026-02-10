"""Guide favorite API models."""

from pydantic import BaseModel, ConfigDict, Field


class GuideFavoriteResponse(BaseModel):
    """Response model for a guide favorite."""

    guide_id: str = Field(..., alias="guideId")
    created_at: str = Field(..., alias="createdAt")

    model_config = ConfigDict(populate_by_name=True)


class GuideFavoriteListResponse(BaseModel):
    """Response model for a list of favorited guide IDs."""

    guide_ids: list[str] = Field(..., alias="guideIds")

    model_config = ConfigDict(populate_by_name=True)
