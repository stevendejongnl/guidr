"""Guide API models."""


from pydantic import BaseModel, ConfigDict, Field


class GuideCreate(BaseModel):
    """Request model for creating a guide."""

    category_id: str = Field(..., alias="categoryId")
    title: str
    description: str | None = None

    model_config = ConfigDict(populate_by_name=True)


class GuideUpdate(BaseModel):
    """Request model for updating a guide."""

    title: str | None = None
    description: str | None = None

    model_config = ConfigDict(populate_by_name=True)


class GuideResponse(BaseModel):
    """Response model for a guide."""

    id: str
    category_id: str = Field(..., alias="categoryId")
    title: str
    description: str | None
    step_ids: list[str] = Field(..., alias="stepIds")
    created_at: str = Field(..., alias="createdAt")
    updated_at: str = Field(..., alias="updatedAt")

    model_config = ConfigDict(populate_by_name=True)
