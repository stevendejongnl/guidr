"""MongoDB mapper for AuditLog entity."""

from typing import Any

from src.domain.entities import AuditLog
from src.domain.value_objects import EntityId

class AuditLogMapper:
    """Maps between AuditLog entity and MongoDB document."""

    @staticmethod
    def to_document(audit_log: AuditLog) -> dict[str, Any]:
        """Convert AuditLog entity to MongoDB document."""
        return {
            "_id": audit_log.id.value,
            "eventType": audit_log.event_type,
            "eventId": audit_log.event_id,
            "occurredAt": audit_log.occurred_at,
            "userId": audit_log.user_id,
            "resourceType": audit_log.resource_type,
            "resourceId": audit_log.resource_id,
            "action": audit_log.action,
            "details": audit_log.details,
            "ipAddress": audit_log.ip_address,
            "userAgent": audit_log.user_agent,
            "createdAt": audit_log.created_at,
        }

    @staticmethod
    def to_entity(document: dict[str, Any]) -> AuditLog:
        """Convert MongoDB document to AuditLog entity."""
        return AuditLog(
            id=EntityId(str(document["_id"])),
            event_type=document["eventType"],
            event_id=document["eventId"],
            occurred_at=document["occurredAt"],
            user_id=document.get("userId"),
            resource_type=document.get("resourceType"),
            resource_id=document.get("resourceId"),
            action=document["action"],
            details=document.get("details", {}),
            ip_address=document.get("ipAddress"),
            user_agent=document.get("userAgent"),
            created_at=document.get("createdAt"),
        )
