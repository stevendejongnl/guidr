"""Audit log API models."""

from pydantic import BaseModel, Field


class AuditLogResponse(BaseModel):
    """Response model for an audit log entry."""

    id: str
    event_type: str = Field(..., alias="eventType")
    occurred_at: str = Field(..., alias="occurredAt")  # ISO format
    user_id: str | None = Field(None, alias="userId")
    resource_type: str | None = Field(None, alias="resourceType")
    resource_id: str | None = Field(None, alias="resourceId")
    action: str
    details: dict = Field(default_factory=dict)
    ip_address: str | None = Field(None, alias="ipAddress")
    user_agent: str | None = Field(None, alias="userAgent")

    class Config:
        """Pydantic config."""

        populate_by_name = True
