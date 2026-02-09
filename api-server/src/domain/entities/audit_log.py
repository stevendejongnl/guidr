"""Audit log domain entity."""

from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any

from ..value_objects import EntityId


@dataclass(frozen=True)
class AuditLog:
    """Audit log entry (immutable record of system events).

    Represents a persisted domain event for audit trail purposes.
    """

    id: EntityId
    event_type: str  # Event class name (e.g., "UserRegistered")
    event_id: str  # Original domain event ID (for deduplication)
    occurred_at: datetime  # When event occurred
    user_id: str | None  # User who triggered event (None = system)
    resource_type: str | None  # Entity type (e.g., "guide", "session")
    resource_id: str | None  # Entity ID
    action: str  # Human-readable action (e.g., "created", "deleted")
    details: dict[str, Any]  # Event-specific data (JSON-serializable)
    ip_address: str | None = None  # Request IP (for API calls)
    user_agent: str | None = None  # User agent (for API calls)
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))

    @property
    def is_admin_action(self) -> bool:
        """Check if action was performed by admin."""
        return (
            self.action in ["deleted", "updated"]
            and self.resource_type in ["guide", "step"]
        )
