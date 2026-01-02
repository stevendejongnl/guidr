"""Category API models."""

from typing import Optional
from pydantic import BaseModel, Field


class CategoryCreate(BaseModel):
    """Request model for creating a category."""

    name: str
    parent_id: Optional[str] = Field(None, alias="parentId")

    class Config:
        """Pydantic config."""

        populate_by_name = True


class CategoryUpdate(BaseModel):
    """Request model for updating a category."""

    name: Optional[str] = None

    class Config:
        """Pydantic config."""

        populate_by_name = True


class CategoryResponse(BaseModel):
    """Response model for a category."""

    id: str
    name: str
    parent_id: Optional[str] = Field(None, alias="parentId")
    created_at: str = Field(..., alias="createdAt")
    updated_at: str = Field(..., alias="updatedAt")

    class Config:
        """Pydantic config."""

        populate_by_name = True
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "name": "Cooking",
                "parentId": None,
                "createdAt": "2024-01-01T00:00:00",
                "updatedAt": "2024-01-01T00:00:00",
            }
        }
