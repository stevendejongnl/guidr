#!/usr/bin/env python3
"""DEPRECATED: Migrate guides from categoryId to guideType + metadata.

This script is deprecated. The migration now runs automatically on
API server startup via src/infrastructure/migrations/.

Maps existing categoryId values to the new guideType field and adds
an empty metadata field. Unknown category IDs default to "general".
"""

import argparse
import asyncio
import sys

from motor.motor_asyncio import AsyncIOMotorClient

from src.infrastructure.config.settings import Settings

VALID_GUIDE_TYPES = {"cooking", "workout", "general"}


async def migrate_guides(dry_run: bool = True) -> None:
    """Migrate guides from categoryId to guideType + metadata.

    Args:
        dry_run: If True, preview changes without applying them
    """
    settings = Settings()
    client: AsyncIOMotorClient = AsyncIOMotorClient(settings.mongodb_url)
    try:
        db = client[settings.mongodb_database]
        guides_collection = db["guides"]

        # Find guides that still have categoryId
        filter_query = {"categoryId": {"$exists": True}}
        cursor = guides_collection.find(filter_query)
        guides = await cursor.to_list(length=None)

        if not guides:
            print("No guides found with categoryId. Migration not needed.")
            return

        print(f"Found {len(guides)} guide(s) to migrate.")

        migrated = 0
        for guide in guides:
            guide_id = guide.get("_id")
            old_category_id = guide.get("categoryId", "")
            title = guide.get("title", "Unknown")

            # Map categoryId to guideType (default to "general")
            guide_type = "general"
            if old_category_id in VALID_GUIDE_TYPES:
                guide_type = old_category_id

            print(
                f"  [{guide_id}] '{title}': "
                f"categoryId='{old_category_id}' -> "
                f"guideType='{guide_type}'"
            )

            if not dry_run:
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

        if dry_run:
            print(f"\nDry run complete. {len(guides)} guide(s) would be migrated.")
            print("Run with --apply to execute the migration.")
        else:
            print(f"\nMigration complete. {migrated} guide(s) updated.")

    finally:
        client.close()


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Migrate guides from categoryId to guideType + metadata"
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Apply changes (default is dry run)",
    )
    args = parser.parse_args()

    dry_run = not args.apply
    if dry_run:
        print("=== DRY RUN MODE (use --apply to execute) ===\n")
    else:
        print("=== APPLYING MIGRATION ===\n")

    asyncio.run(migrate_guides(dry_run=dry_run))


if __name__ == "__main__":
    sys.exit(main() or 0)
