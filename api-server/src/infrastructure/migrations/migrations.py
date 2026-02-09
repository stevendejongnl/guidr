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


# List of all migrations in order
# Each tuple is (migration_id, migration_function)
MIGRATIONS: list[tuple[str, MigrationFunc]] = [
    ("001_migrate_guides_category_to_type", migrate_guides_category_to_type),
]
