"""Config API models."""

from pydantic import BaseModel, ConfigDict, Field


class ConfigResponse(BaseModel):
    """Response model for server configuration."""

    model_config = ConfigDict(populate_by_name=True)

    min_app_version: str | None = Field(None, alias="minAppVersion")
    max_app_version: str | None = Field(None, alias="maxAppVersion")
    sentry_dsn: str | None = Field(None, alias="sentryDsn")
