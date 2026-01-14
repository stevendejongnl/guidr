"""Category API models."""


from pydantic import BaseModel, ConfigDict, Field


class CategoryCreate(BaseModel):
    """Request model for creating a category."""

    model_config = ConfigDict(populate_by_name=True)

    name: str
    parent_id: str | None = Field(None, alias="parentId")


class CategoryUpdate(BaseModel):
    """Request model for updating a category."""

    model_config = ConfigDict(populate_by_name=True)

    name: str | None = None


class CategoryResponse(BaseModel):
    """Response model for a category."""

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "name": "Cooking",
                "parentId": None,
                "createdAt": "2024-01-01T00:00:00",
                "updatedAt": "2024-01-01T00:00:00",
            }
        }
    )

    id: str
    name: str
    parent_id: str | None = Field(None, alias="parentId")
    created_at: str = Field(..., alias="createdAt")
    updated_at: str = Field(..., alias="updatedAt")
