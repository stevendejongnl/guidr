"""Config API models."""

from pydantic import BaseModel, Field


class ConfigResponse(BaseModel):
    """Response model for server configuration."""

    min_app_version: str | None = Field(None, alias="minAppVersion")
    max_app_version: str | None = Field(None, alias="maxAppVersion")

    class Config:
        """Pydantic config."""

        populate_by_name = True
