#!/usr/bin/env python3
"""Migrate guides to add ownership and visibility fields."""

import argparse
import asyncio
import sys
from datetime import UTC, datetime

from motor.motor_asyncio import AsyncIOMotorClient

from src.infrastructure.config.settings import Settings


async def migrate_guides(dry_run: bool = True) -> None:
    """Migrate guides to add ownership and visibility fields.

    Args:
        dry_run: If True, preview changes without applying them
    """
    settings = Settings()
    client: AsyncIOMotorClient = AsyncIOMotorClient(settings.mongodb_url)
    try:
        db = client[settings.mongodb_database]
        guides_collection = db["guides"]

        # Find guides missing the new fields
        filter_query = {
            "$or": [
                {"createdByUserId": {"$exists": False}},
                {"isPublic": {"$exists": False}},
                {"isHighlighted": {"$exists": False}},
            ]
        }

        count = await guides_collection.count_documents(filter_query)
        print(f"Found {count} guides to migrate")

        if dry_run:
            print("\n[DRY RUN] Preview of migration:")
            guides = await guides_collection.find(filter_query).limit(5).to_list(None)
            for guide in guides:
                print(f"  - {guide.get('_id')}: {guide.get('title')}")
            if count > 5:
                print(f"  ... and {count - 5} more")
            return

        # Apply migration
        update_data = {
            "createdByUserId": None,  # Legacy guides have no owner
            "isPublic": False,        # Default to private
            "isHighlighted": False,   # Default to not highlighted
            "updatedAt": datetime.now(UTC),
        }

        result = await guides_collection.update_many(
            filter_query,
            {"$set": update_data},
        )

        print("\nMigration completed:")
        print(f"  Modified: {result.modified_count}")
        print(f"  Matched: {result.matched_count}")
        print(f"  Upserted: {result.upserted_id}")

        # Verify migration
        remaining = await guides_collection.count_documents(filter_query)
        if remaining == 0:
            print("\n✓ All guides successfully migrated!")
        else:
            print(f"\n⚠ Warning: {remaining} guides still missing fields")

    finally:
        client.close()


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Migrate guides to add ownership and visibility fields"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        default=True,
        help="Preview changes without applying (default: True)",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Apply the migration (disables dry-run)",
    )
    args = parser.parse_args()

    dry_run = not args.apply

    if dry_run:
        print("Running in DRY RUN mode. Use --apply to make changes.\n")
    else:
        confirm = input(
            "⚠ This will modify the database. Continue? (yes/no): "
        ).strip().lower()
        if confirm != "yes":
            print("Migration cancelled.")
            return

    try:
        asyncio.run(migrate_guides(dry_run=dry_run))
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
