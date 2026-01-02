"""Guide API models."""

from typing import Optional
from pydantic import BaseModel, Field


class GuideCreate(BaseModel):
    """Request model for creating a guide."""

    category_id: str = Field(..., alias="categoryId")
    title: str
    description: Optional[str] = None

    class Config:
        """Pydantic config."""

        populate_by_name = True


class GuideUpdate(BaseModel):
    """Request model for updating a guide."""

    title: Optional[str] = None
    description: Optional[str] = None

    class Config:
        """Pydantic config."""

        populate_by_name = True


class GuideResponse(BaseModel):
    """Response model for a guide."""

    id: str
    category_id: str = Field(..., alias="categoryId")
    title: str
    description: Optional[str]
    step_ids: list[str] = Field(..., alias="stepIds")
    created_at: str = Field(..., alias="createdAt")
    updated_at: str = Field(..., alias="updatedAt")

    class Config:
        """Pydantic config."""

        populate_by_name = True
