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

    # Step timers collection indexes
    step_timers = database["step_timers"]

    # Compound index for guide+user queries (primary access pattern)
    await step_timers.create_index(
        [("guideId", 1), ("userId", 1)]
    )

    # Compound index for step+user lookups
    await step_timers.create_index(
        [("stepId", 1), ("userId", 1)], unique=True
    )

    # Guide favorites collection indexes
    guide_favorites = database["guide_favorites"]

    # Unique compound index for user+guide (prevents duplicate favorites)
    await guide_favorites.create_index(
        [("userId", 1), ("guideId", 1)], unique=True
    )
