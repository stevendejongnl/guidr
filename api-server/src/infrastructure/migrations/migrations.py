"""Database migration definitions."""

import logging

from motor.motor_asyncio import AsyncIOMotorDatabase

from .migration_runner import MigrationFunc

logger = logging.getLogger(__name__)

VALID_GUIDE_TYPES = {"cooking", "workout", "general"}


async def migrate_guides_category_to_type(
    db: AsyncIOMotorDatabase,
) -> None:
    """Migrate guides from categoryId to guideType + metadata.

    Maps existing categoryId values to the new guideType field and adds
    an empty metadata field. Unknown category IDs default to "general".
    """
    guides_collection = db["guides"]

    # Find guides that still have categoryId
    filter_query = {"categoryId": {"$exists": True}}
    cursor = guides_collection.find(filter_query)
    guides = await cursor.to_list(length=None)

    if not guides:
        logger.info("No guides with categoryId found. Migration not needed.")
        return

    logger.info(f"Found {len(guides)} guide(s) to migrate.")

    migrated = 0
    for guide in guides:
        guide_id = guide.get("_id")
        old_category_id = guide.get("categoryId", "")
        title = guide.get("title", "Unknown")

        # Map categoryId to guideType (default to "general")
        guide_type = "general"
        if old_category_id in VALID_GUIDE_TYPES:
            guide_type = old_category_id

        logger.debug(
            f"  [{guide_id}] '{title}': "
            f"categoryId='{old_category_id}' -> "
            f"guideType='{guide_type}'"
        )

        await guides_collection.update_one(
            {"_id": guide_id},
            {
                "$set": {
                    "guideType": guide_type,
                    "metadata": None,
                },
                "$unset": {"categoryId": ""},
            },
        )
        migrated += 1

    logger.info(f"Migration complete. {migrated} guide(s) updated.")


async def migrate_guides_add_language(
    db: AsyncIOMotorDatabase,
) -> None:
    """Set language='en' on all guides that don't have it yet."""
    guides_collection = db["guides"]
    result = await guides_collection.update_many(
        {"language": {"$exists": False}},
        {"$set": {"language": "en"}},
    )
    logger.info(
        f"Set language='en' on {result.modified_count} guide(s)."
    )


async def migrate_users_add_preferred_languages(
    db: AsyncIOMotorDatabase,
) -> None:
    """Set preferredLanguages=['en'] on all users that don't have it."""
    users_collection = db["users"]
    result = await users_collection.update_many(
        {"preferredLanguages": {"$exists": False}},
        {"$set": {"preferredLanguages": ["en"]}},
    )
    logger.info(
        f"Set preferredLanguages on {result.modified_count} user(s)."
    )


async def migrate_guides_add_deleted_at(
    db: AsyncIOMotorDatabase,
) -> None:
    """Backfill deletedAt=None on guides that don't have it yet."""
    guides_collection = db["guides"]
    result = await guides_collection.update_many(
        {"deletedAt": {"$exists": False}},
        {"$set": {"deletedAt": None}},
    )
    logger.info(
        f"Set deletedAt=None on {result.modified_count} guide(s)."
    )


async def migrate_users_add_deleted_at(
    db: AsyncIOMotorDatabase,
) -> None:
    """Backfill deletedAt=None on users that don't have it yet."""
    users_collection = db["users"]
    result = await users_collection.update_many(
        {"deletedAt": {"$exists": False}},
        {"$set": {"deletedAt": None}},
    )
    logger.info(
        f"Set deletedAt=None on {result.modified_count} user(s)."
    )


async def migrate_guides_add_ownership_fields(
    db: AsyncIOMotorDatabase,
) -> None:
    """Backfill ownership and visibility fields on legacy guides.

    Guides created before ownership was introduced have no createdByUserId,
    isPublic, or isHighlighted. Set safe defaults: no owner (admin-only
    access), private, and not highlighted.
    """
    guides_collection = db["guides"]
    result = await guides_collection.update_many(
        {
            "$or": [
                {"createdByUserId": {"$exists": False}},
                {"isPublic": {"$exists": False}},
                {"isHighlighted": {"$exists": False}},
            ]
        },
        {
            "$set": {
                "createdByUserId": None,
                "isPublic": False,
                "isHighlighted": False,
            }
        },
    )
    logger.info(
        f"Backfilled ownership fields on {result.modified_count} guide(s)."
    )


# List of all migrations in order
# Each tuple is (migration_id, migration_function)
MIGRATIONS: list[tuple[str, MigrationFunc]] = [
    ("001_migrate_guides_category_to_type", migrate_guides_category_to_type),
    ("002_migrate_guides_add_language", migrate_guides_add_language),
    ("003_migrate_users_add_preferred_languages", migrate_users_add_preferred_languages),
    ("004_add_deleted_at_to_guides", migrate_guides_add_deleted_at),
    ("005_add_deleted_at_to_users", migrate_users_add_deleted_at),
    ("006_guides_add_ownership_fields", migrate_guides_add_ownership_fields),
]
