"""Integration tests for audit logs API endpoints."""

import uuid
from datetime import UTC, datetime

import pytest
from httpx import AsyncClient
from motor.motor_asyncio import AsyncIOMotorDatabase


@pytest.mark.asyncio
class TestAuditLogsEndpoints:
    """Integration tests for GET /audit-logs (admin only)."""

    async def test_admin_can_query_audit_logs_empty(
        self, client: AsyncClient, admin_headers: dict
    ) -> None:
        """Test that admin can query audit logs and get an empty list."""
        response = await client.get(
            "/api/v1/audit-logs",
            headers=admin_headers,
        )
        assert response.status_code == 200
        logs = response.json()
        assert isinstance(logs, list)

    async def test_unauthenticated_gets_401(
        self, client: AsyncClient
    ) -> None:
        """Test that unauthenticated requests get 401."""
        response = await client.get("/api/v1/audit-logs")
        assert response.status_code == 401

    async def test_non_admin_gets_403(
        self, client: AsyncClient
    ) -> None:
        """Test that non-admin users get 403 Forbidden."""
        # Seed a first user (auto-admin), then register a regular user
        await client.post(
            "/api/v1/auth/register",
            json={"email": "seed@auditlog.com", "password": "password123"},
        )
        reg = await client.post(
            "/api/v1/auth/register",
            json={"email": "regular@auditlog.com", "password": "password123"},
        )
        token = reg.json().get("accessToken") or reg.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}

        response = await client.get("/api/v1/audit-logs", headers=headers)
        assert response.status_code == 403

    async def test_admin_can_filter_by_user_id(
        self, client: AsyncClient, admin_headers: dict
    ) -> None:
        """Test that admin can filter audit logs by userId query param."""
        response = await client.get(
            "/api/v1/audit-logs",
            params={"userId": "non-existent-user"},
            headers=admin_headers,
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    async def test_admin_can_filter_by_resource_type(
        self, client: AsyncClient, admin_headers: dict
    ) -> None:
        """Test that admin can filter audit logs by resourceType query param."""
        response = await client.get(
            "/api/v1/audit-logs",
            params={"resourceType": "guide"},
            headers=admin_headers,
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    async def test_admin_can_filter_by_resource_id(
        self, client: AsyncClient, admin_headers: dict
    ) -> None:
        """Test filtering by resourceId (requires resourceType too)."""
        response = await client.get(
            "/api/v1/audit-logs",
            params={"resourceType": "guide", "resourceId": "some-guide-id"},
            headers=admin_headers,
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    async def test_admin_can_filter_by_date_range(
        self, client: AsyncClient, admin_headers: dict
    ) -> None:
        """Test that admin can filter by startDate and endDate."""
        response = await client.get(
            "/api/v1/audit-logs",
            params={
                "startDate": "2020-01-01T00:00:00Z",
                "endDate": "2030-01-01T00:00:00Z",
            },
            headers=admin_headers,
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    async def test_admin_can_paginate_with_limit_and_offset(
        self, client: AsyncClient, admin_headers: dict
    ) -> None:
        """Test that limit and offset query params are accepted."""
        response = await client.get(
            "/api/v1/audit-logs",
            params={"limit": 10, "offset": 0},
            headers=admin_headers,
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    async def test_audit_log_response_shape_when_entries_exist(
        self, client: AsyncClient, admin_headers: dict, db: AsyncIOMotorDatabase
    ) -> None:
        """Test that audit log response entries have expected fields when queried by resource."""
        # Seed a log entry using mapper-compatible camelCase document format.
        # The default query uses find_admin_actions (action in [deleted, updated]),
        # so we use resourceType+resourceId filter which calls find_by_resource.
        # EntityId validates UUIDs or ObjectIds — use a proper UUID for _id.
        log_id = str(uuid.uuid4())
        now = datetime.now(UTC)
        await db["audit_logs"].insert_one(
            {
                "_id": log_id,
                "eventType": "guide.deleted",
                "eventId": str(uuid.uuid4()),
                "occurredAt": now,
                "userId": str(uuid.uuid4()),
                "resourceType": "guide",
                "resourceId": "guide-shape-001",
                "action": "deleted",
                "details": {},
                "ipAddress": None,
                "userAgent": None,
                "createdAt": now,
            }
        )

        response = await client.get(
            "/api/v1/audit-logs",
            params={"resourceType": "guide", "resourceId": "guide-shape-001"},
            headers=admin_headers,
        )
        assert response.status_code == 200
        logs = response.json()
        assert len(logs) >= 1
        log = logs[0]
        assert "id" in log
        assert "eventType" in log
        assert "occurredAt" in log
        assert "userId" in log
        assert "resourceType" in log
        assert "resourceId" in log
        assert "action" in log
