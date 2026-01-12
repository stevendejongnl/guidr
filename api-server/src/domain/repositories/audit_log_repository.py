"""Audit log repository interface."""

from abc import abstractmethod
from datetime import datetime

from ..entities import AuditLog
from .base import IRepository


class IAuditLogRepository(IRepository[AuditLog]):
    """Repository interface for audit logs."""

    @abstractmethod
    async def find_by_user(
        self, user_id: str, limit: int = 100, offset: int = 0
    ) -> list[AuditLog]:
        """Find audit logs for a specific user.

        Args:
            user_id: User ID to filter by
            limit: Maximum number of results
            offset: Pagination offset

        Returns:
            List of audit logs ordered by occurred_at DESC
        """
        pass

    @abstractmethod
    async def find_by_resource(
        self, resource_type: str, resource_id: str
    ) -> list[AuditLog]:
        """Find audit logs for a specific resource.

        Args:
            resource_type: Type of resource (e.g., "guide")
            resource_id: Resource ID

        Returns:
            List of audit logs ordered by occurred_at DESC
        """
        pass

    @abstractmethod
    async def find_by_date_range(
        self, start_date: datetime, end_date: datetime, limit: int = 1000
    ) -> list[AuditLog]:
        """Find audit logs within a date range.

        Args:
            start_date: Start of date range
            end_date: End of date range
            limit: Maximum number of results

        Returns:
            List of audit logs ordered by occurred_at DESC
        """
        pass

    @abstractmethod
    async def find_admin_actions(
        self, limit: int = 100, offset: int = 0
    ) -> list[AuditLog]:
        """Find all admin actions (sensitive operations).

        Returns:
            List of admin actions ordered by occurred_at DESC
        """
        pass
