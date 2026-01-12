"""Domain service for persisting events to audit log."""

from typing import Protocol
from uuid import uuid4

from ..entities import AuditLog
from ..events import (
    BaseDomainEvent,
    CategoryCreated,
    CategoryDeleted,
    CategoryUpdated,
    GuideCreated,
    GuideDeleted,
    GuideUpdated,
    SessionCancelled,
    SessionCompleted,
    SessionCreated,
    SessionPaused,
    SessionResumed,
    SessionStarted,
    SessionStepChanged,
    StepCreated,
    StepDeleted,
    StepUpdated,
    UserLoggedIn,
    UserPromotedToAdmin,
    UserRegistered,
    UserRoleChanged,
)
from ..repositories import IAuditLogRepository
from ..value_objects import EntityId


class IEventPersistenceService(Protocol):
    """Protocol for event persistence service."""

    async def persist_event(
        self,
        event: BaseDomainEvent,
        user_id: str | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> None:
        """Persist domain event to audit log."""
        ...


class EventPersistenceService:
    """Service for converting domain events to audit logs."""

    def __init__(self, audit_log_repository: IAuditLogRepository):
        """Initialize service.

        Args:
            audit_log_repository: Repository for audit log persistence
        """
        self._repository = audit_log_repository

    async def persist_event(
        self,
        event: BaseDomainEvent,
        user_id: str | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> None:
        """Persist domain event to audit log.

        Args:
            event: Domain event to persist
            user_id: User who triggered event (None = system)
            ip_address: Request IP address
            user_agent: Request user agent
        """
        audit_log = self._map_event_to_audit_log(
            event, user_id, ip_address, user_agent
        )
        await self._repository.save(audit_log)

    def _map_event_to_audit_log(
        self,
        event: BaseDomainEvent,
        user_id: str | None,
        ip_address: str | None,
        user_agent: str | None,
    ) -> AuditLog:
        """Map domain event to audit log entity.

        Uses pattern matching to extract metadata from each event type.
        """
        # Base audit log fields
        audit_data = {
            "id": EntityId(str(uuid4())),
            "event_type": event.event_type,
            "event_id": event.event_id,
            "occurred_at": event.occurred_at,
            "user_id": user_id,
            "ip_address": ip_address,
            "user_agent": user_agent,
        }

        # Event-specific mapping
        if isinstance(event, UserRegistered):
            return AuditLog(
                **audit_data,
                resource_type="user",
                resource_id=event.user_id,
                action="registered",
                details={"email": event.email},
            )

        elif isinstance(event, UserLoggedIn):
            return AuditLog(
                **audit_data,
                resource_type="user",
                resource_id=event.user_id,
                action="logged_in",
                details={"email": event.email},
            )

        elif isinstance(event, UserRoleChanged):
            return AuditLog(
                **audit_data,
                resource_type="user",
                resource_id=event.user_id,
                action="role_changed",
                details={
                    "old_role": event.old_role,
                    "new_role": event.new_role,
                    "changed_by": event.changed_by_user_id,
                },
            )

        elif isinstance(event, UserPromotedToAdmin):
            return AuditLog(
                **audit_data,
                resource_type="user",
                resource_id=event.user_id,
                action="promoted_to_admin",
                details={
                    "email": event.email,
                    "promoted_by": event.promoted_by_user_id,
                    "reason": event.reason,
                },
            )


        elif isinstance(event, GuideCreated):
            return AuditLog(
                **audit_data,
                resource_type="guide",
                resource_id=event.guide_id,
                action="created",
                details={"title": event.title, "category_id": event.category_id},
            )

        elif isinstance(event, GuideUpdated):
            return AuditLog(
                **audit_data,
                resource_type="guide",
                resource_id=event.guide_id,
                action="updated",
                details={"title": event.title},
            )

        elif isinstance(event, GuideDeleted):
            return AuditLog(
                **audit_data,
                resource_type="guide",
                resource_id=event.guide_id,
                action="deleted",
                details={"title": event.title},
            )

        elif isinstance(event, CategoryCreated):
            return AuditLog(
                **audit_data,
                resource_type="category",
                resource_id=event.category_id,
                action="created",
                details={"name": event.name},
            )

        elif isinstance(event, CategoryUpdated):
            return AuditLog(
                **audit_data,
                resource_type="category",
                resource_id=event.category_id,
                action="updated",
                details={"name": event.name},
            )

        elif isinstance(event, CategoryDeleted):
            return AuditLog(
                **audit_data,
                resource_type="category",
                resource_id=event.category_id,
                action="deleted",
                details={"name": event.name},
            )

        elif isinstance(event, StepCreated):
            return AuditLog(
                **audit_data,
                resource_type="step",
                resource_id=event.step_id,
                action="created",
                details={"title": event.title, "guide_id": event.guide_id},
            )

        elif isinstance(event, StepUpdated):
            return AuditLog(
                **audit_data,
                resource_type="step",
                resource_id=event.step_id,
                action="updated",
                details={"title": event.title},
            )

        elif isinstance(event, StepDeleted):
            return AuditLog(
                **audit_data,
                resource_type="step",
                resource_id=event.step_id,
                action="deleted",
                details={"title": event.title},
            )

        elif isinstance(event, SessionCreated):
            return AuditLog(
                **audit_data,
                resource_type="session",
                resource_id=event.session_id,
                action="created",
                details={"guide_id": event.guide_id},
            )

        elif isinstance(event, SessionStarted):
            return AuditLog(
                **audit_data,
                resource_type="session",
                resource_id=event.session_id,
                action="started",
                details={},
            )

        elif isinstance(event, SessionPaused):
            return AuditLog(
                **audit_data,
                resource_type="session",
                resource_id=event.session_id,
                action="paused",
                details={},
            )

        elif isinstance(event, SessionResumed):
            return AuditLog(
                **audit_data,
                resource_type="session",
                resource_id=event.session_id,
                action="resumed",
                details={},
            )

        elif isinstance(event, SessionCompleted):
            return AuditLog(
                **audit_data,
                resource_type="session",
                resource_id=event.session_id,
                action="completed",
                details={},
            )

        elif isinstance(event, SessionCancelled):
            return AuditLog(
                **audit_data,
                resource_type="session",
                resource_id=event.session_id,
                action="cancelled",
                details={},
            )

        elif isinstance(event, SessionStepChanged):
            return AuditLog(
                **audit_data,
                resource_type="session",
                resource_id=event.session_id,
                action="step_changed",
                details={"step_id": event.step_id},
            )

        else:
            # Generic fallback for unmapped events
            return AuditLog(
                **audit_data,
                resource_type=None,
                resource_id=None,
                action="unknown",
                details={"event_data": event.__dict__},
            )
