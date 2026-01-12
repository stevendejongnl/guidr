"""Audit logs API router."""

from fastapi import APIRouter, Depends, Query

from src.application.dtos import AuditLogQueryDTO
from src.application.use_cases.audit_log import GetAuditLogs
from src.container import Container
from src.domain.entities import User
from ..dependencies.auth import get_current_admin_user
from ..models import AuditLogResponse

router = APIRouter(prefix="/audit-logs", tags=["audit-logs"])


# Container (injected at app startup)
_container: Container | None = None


def set_container(container: Container) -> None:
    """Set the DI container for this router."""
    global _container
    _container = container


# Dependency providers
def get_audit_logs_use_case() -> GetAuditLogs:
    assert _container is not None, "Container not initialized"
    return _container.get_audit_logs_use_case()


@router.get("", response_model=list[AuditLogResponse])
async def query_audit_logs(
    user_id: str | None = Query(None, alias="userId"),
    resource_type: str | None = Query(None, alias="resourceType"),
    resource_id: str | None = Query(None, alias="resourceId"),
    start_date: str | None = Query(None, alias="startDate"),
    end_date: str | None = Query(None, alias="endDate"),
    limit: int = Query(100),
    offset: int = Query(0),
    current_user: User = Depends(get_current_admin_user),
    use_case: GetAuditLogs = Depends(get_audit_logs_use_case),
) -> list[AuditLogResponse]:
    """Get audit logs matching query criteria.

    Requires admin role.

    Query parameters:
    - userId: Filter by user ID
    - resourceType: Filter by resource type (guide, category, session, etc.)
    - resourceId: Filter by resource ID (must be used with resourceType)
    - startDate: Filter by start date (ISO format)
    - endDate: Filter by end date (ISO format)
    - limit: Maximum number of results (default: 100)
    - offset: Number of results to skip (default: 0)

    Returns:
        List of audit log entries matching the query criteria
    """
    query = AuditLogQueryDTO(
        user_id=user_id,
        resource_type=resource_type,
        resource_id=resource_id,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=offset,
    )

    logs = await use_case.execute(query, current_user)
    return [
        AuditLogResponse(
            id=log.id,
            event_type=log.event_type,
            occurred_at=log.occurred_at,
            user_id=log.user_id,
            resource_type=log.resource_type,
            resource_id=log.resource_id,
            action=log.action,
            details=log.details,
            ip_address=log.ip_address,
            user_agent=log.user_agent,
        )
        for log in logs
    ]
