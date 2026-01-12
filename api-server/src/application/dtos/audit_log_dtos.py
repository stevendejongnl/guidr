"""Audit log DTOs for application layer."""

from dataclasses import dataclass
from typing import Any

@dataclass
class AuditLogResponseDTO:
    """DTO for audit log response."""

    id: str
    event_type: str
    occurred_at: str  # ISO format
    user_id: str | None
    resource_type: str | None
    resource_id: str | None
    action: str
    details: dict[str, Any]
    ip_address: str | None
    user_agent: str | None

@dataclass
class AuditLogQueryDTO:
    """DTO for querying audit logs."""

    user_id: str | None = None
    resource_type: str | None = None
    resource_id: str | None = None
    start_date: str | None = None  # ISO format
    end_date: str | None = None  # ISO format
    limit: int = 100
    offset: int = 0
