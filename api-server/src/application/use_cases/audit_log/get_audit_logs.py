"""Get audit logs use case."""

from datetime import datetime

from src.application.authorization import require_admin
from src.application.dtos import AuditLogQueryDTO, AuditLogResponseDTO
from src.domain.entities import User
from src.domain.repositories import IAuditLogRepository

class GetAuditLogs:
    """Use case for retrieving audit logs (admin only)."""

    def __init__(self, audit_log_repository: IAuditLogRepository):
        """Initialize use case.

        Args:
            audit_log_repository: Repository for audit log persistence
        """
        self._repository = audit_log_repository

    async def execute(
        self, query: AuditLogQueryDTO, current_user: User
    ) -> list[AuditLogResponseDTO]:
        """Get audit logs matching query criteria.

        Args:
            query: Query parameters
            current_user: Authenticated user (must be admin)

        Returns:
            List of audit log entries

        Raises:
            AuthorizationException: If user is not admin
        """
        require_admin(current_user)

        # Query based on filters
        if query.user_id:
            logs = await self._repository.find_by_user(
                query.user_id, query.limit, query.offset
            )
        elif query.resource_type and query.resource_id:
            logs = await self._repository.find_by_resource(
                query.resource_type, query.resource_id
            )
        elif query.start_date and query.end_date:
            start = datetime.fromisoformat(query.start_date)
            end = datetime.fromisoformat(query.end_date)
            logs = await self._repository.find_by_date_range(start, end, query.limit)
        else:
            # Default: recent admin actions
            logs = await self._repository.find_admin_actions(query.limit, query.offset)

        # Convert to DTOs
        return [
            AuditLogResponseDTO(
                id=log.id.value,
                event_type=log.event_type,
                occurred_at=log.occurred_at.isoformat(),
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
