"""MongoDB index definitions."""

from motor.motor_asyncio import AsyncIOMotorDatabase


async def create_indexes(database: AsyncIOMotorDatabase) -> None:
    """Create MongoDB indexes for optimal query performance.

    Args:
        database: MongoDB database instance
    """
    # Audit logs collection indexes
    audit_logs = database["audit_logs"]

    # Index for queries by user
    await audit_logs.create_index("userId")

    # Index for queries by resource
    await audit_logs.create_index([("resourceType", 1), ("resourceId", 1)])

    # Index for date range queries
    await audit_logs.create_index([("occurredAt", -1)])

    # Index for admin action queries
    await audit_logs.create_index([("action", 1), ("resourceType", 1)])

    # Compound index for event deduplication
    await audit_logs.create_index("eventId", unique=True)

    # Users collection indexes
    users = database["users"]

    # Index for role queries (future admin listing)
    await users.create_index("role")
