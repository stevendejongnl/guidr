#!/usr/bin/env python3
"""Backfill stepIds on all guide documents from the steps collection.

Guides were stored without stepIds because CreateStep/DeleteStep never updated
the guide document. This script rebuilds stepIds for every guide by querying
the steps collection and grouping by guideId.

Usage:
    python backfill_guide_step_ids.py              # Dry run (preview only)
    python backfill_guide_step_ids.py --apply      # Apply changes
    python backfill_guide_step_ids.py --env production --apply
"""

import argparse
import sys
from datetime import UTC, datetime

sys.path.insert(0, str(__import__("pathlib").Path(__file__).parent))
from connection import add_env_argument, get_db


def main():
    parser = argparse.ArgumentParser(
        description="Backfill guide stepIds from steps collection (dry-run by default)"
    )
    add_env_argument(parser)
    parser.add_argument("--apply", action="store_true", help="Actually apply changes")
    args = parser.parse_args()

    db = get_db(args)
    dry = not args.apply
    mode = "DRY RUN" if dry else "APPLYING"

    print(f"Backfill guide stepIds [{mode}]")
    print("=" * 60)

    # Build guideId → [stepId, ...] map from steps collection
    steps_by_guide: dict[str, list[str]] = {}
    for step in db["steps"].find({}, {"_id": 1, "guideId": 1}):
        guide_id = step.get("guideId")
        step_id = str(step["_id"])
        if guide_id:
            steps_by_guide.setdefault(guide_id, []).append(step_id)

    print(f"Found {len(steps_by_guide)} guides with steps in steps collection")

    guides = list(db["guides"].find({"deletedAt": None}, {"_id": 1, "stepIds": 1}))
    print(f"Found {len(guides)} active guides")
    print()

    updated = 0
    already_correct = 0

    for guide in guides:
        guide_id = str(guide["_id"])
        current_ids = sorted(guide.get("stepIds") or [])
        expected_ids = sorted(steps_by_guide.get(guide_id, []))

        if current_ids == expected_ids:
            already_correct += 1
            continue

        print(f"  Guide {guide_id[:8]}...")
        print(f"    current stepIds: {current_ids}")
        print(f"    correct stepIds: {expected_ids}")

        if not dry:
            db["guides"].update_one(
                {"_id": guide["_id"]},
                {"$set": {"stepIds": expected_ids, "updatedAt": datetime.now(UTC)}},
            )

        updated += 1

    print()
    print(f"Already correct: {already_correct}")
    if dry:
        print(f"Would update:    {updated}")
        if updated:
            print("\nRun with --apply to execute.")
    else:
        print(f"Updated:         {updated}")


if __name__ == "__main__":
    main()
