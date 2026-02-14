#!/usr/bin/env python3
"""MongoDB data fix tool for Guidr database.

All operations run in DRY-RUN mode by default. Use --apply to execute changes.

Usage:
    python fix.py remove-orphans                         # Preview orphan removal
    python fix.py remove-orphans --apply                 # Actually remove orphans
    python fix.py set-field <coll> <field> <value>       # Set field on all docs
    python fix.py set-field <coll> <field> <value> --filter '{"status": "old"}'
    python fix.py unset-field <coll> <field>             # Remove field from all docs
    python fix.py rename-field <coll> <old> <new>        # Rename a field
    python fix.py update <coll> --filter '...' --update '{"$set": {"key": "val"}}'
    python fix.py delete <coll> --filter '{"obsolete": true}'
"""

import argparse
import json
import sys
from datetime import datetime

from bson import ObjectId

sys.path.insert(0, str(__import__("pathlib").Path(__file__).parent))
from connection import add_env_argument, get_db

KNOWN_RELATIONS = {
    "steps": {"foreign_field": "guideId", "parent_collection": "guides", "parent_field": "id"},
    "sessions": {"foreign_field": "guideId", "parent_collection": "guides", "parent_field": "id"},
    "step_timers": {
        "foreign_field": "guideId", "parent_collection": "guides", "parent_field": "id",
    },
    "guide_favorites": {
        "foreign_field": "guideId", "parent_collection": "guides", "parent_field": "id",
    },
}


def json_serialize(obj):
    if isinstance(obj, ObjectId):
        return str(obj)
    if isinstance(obj, datetime):
        return obj.isoformat()
    return str(obj)


def cmd_remove_orphans(db, args):
    dry = not args.apply
    mode = "DRY RUN" if dry else "APPLYING"
    print(f"Remove Orphaned Records [{mode}]")
    print("=" * 60)

    total_removed = 0
    for child_coll, rel in KNOWN_RELATIONS.items():
        if child_coll not in db.list_collection_names():
            continue

        parent_ids = set()
        for doc in db[rel["parent_collection"]].find({}, {rel["parent_field"]: 1}):
            if rel["parent_field"] in doc:
                parent_ids.add(doc[rel["parent_field"]])

        orphan_ids = []
        for doc in db[child_coll].find({}, {rel["foreign_field"]: 1, "_id": 1}):
            fk = doc.get(rel["foreign_field"])
            if fk and fk not in parent_ids:
                orphan_ids.append(doc["_id"])

        if orphan_ids:
            print(f"\n  {child_coll}: {len(orphan_ids)} orphans")
            if not dry:
                result = db[child_coll].delete_many({"_id": {"$in": orphan_ids}})
                print(f"    Deleted: {result.deleted_count}")
                total_removed += result.deleted_count
            else:
                print(f"    Would delete: {len(orphan_ids)}")
                total_removed += len(orphan_ids)

    if total_removed == 0:
        print("\nNo orphans found.")
    elif dry:
        print(f"\nWould remove {total_removed} orphans. Run with --apply to execute.")


def cmd_set_field(db, args):
    dry = not args.apply
    mode = "DRY RUN" if dry else "APPLYING"
    filt = json.loads(args.filter) if args.filter else {}

    value = args.value
    # Try to parse as JSON for non-string values
    try:
        value = json.loads(value)
    except (json.JSONDecodeError, TypeError):
        pass

    count = db[args.collection].count_documents(filt)
    print(f"Set '{args.field}' = {json.dumps(value)} on {count} docs in '{args.collection}' [{mode}]")

    if not dry and count > 0:
        result = db[args.collection].update_many(filt, {"$set": {args.field: value}})
        print(f"  Modified: {result.modified_count}")
    elif dry:
        print(f"  Would modify: {count}. Run with --apply to execute.")


def cmd_unset_field(db, args):
    dry = not args.apply
    mode = "DRY RUN" if dry else "APPLYING"
    filt = json.loads(args.filter) if args.filter else {}

    count = db[args.collection].count_documents(
        {**filt, args.field: {"$exists": True}}
    )
    print(f"Unset '{args.field}' from {count} docs in '{args.collection}' [{mode}]")

    if not dry and count > 0:
        result = db[args.collection].update_many(filt, {"$unset": {args.field: ""}})
        print(f"  Modified: {result.modified_count}")
    elif dry:
        print(f"  Would modify: {count}. Run with --apply to execute.")


def cmd_rename_field(db, args):
    dry = not args.apply
    mode = "DRY RUN" if dry else "APPLYING"

    count = db[args.collection].count_documents({args.old_field: {"$exists": True}})
    print(f"Rename '{args.old_field}' → '{args.new_field}' on {count} docs [{mode}]")

    if not dry and count > 0:
        result = db[args.collection].update_many(
            {}, {"$rename": {args.old_field: args.new_field}}
        )
        print(f"  Modified: {result.modified_count}")
    elif dry:
        print(f"  Would modify: {count}. Run with --apply to execute.")


def cmd_update(db, args):
    dry = not args.apply
    mode = "DRY RUN" if dry else "APPLYING"
    filt = json.loads(args.filter) if args.filter else {}
    update = json.loads(args.update)

    count = db[args.collection].count_documents(filt)
    print(f"Update {count} docs in '{args.collection}' [{mode}]")
    print(f"  Filter: {json.dumps(filt)}")
    print(f"  Update: {json.dumps(update)}")

    if not dry and count > 0:
        result = db[args.collection].update_many(filt, update)
        print(f"  Modified: {result.modified_count}")
    elif dry:
        print(f"  Would modify: {count}. Run with --apply to execute.")


def cmd_delete(db, args):
    dry = not args.apply
    mode = "DRY RUN" if dry else "APPLYING"
    filt = json.loads(args.filter) if args.filter else {}

    if not filt:
        print("ERROR: --filter is required for delete (safety check)")
        sys.exit(1)

    count = db[args.collection].count_documents(filt)
    print(f"Delete {count} docs from '{args.collection}' [{mode}]")
    print(f"  Filter: {json.dumps(filt)}")

    if not dry and count > 0:
        result = db[args.collection].delete_many(filt)
        print(f"  Deleted: {result.deleted_count}")
    elif dry:
        print(f"  Would delete: {count}. Run with --apply to execute.")


def main():
    parser = argparse.ArgumentParser(
        description="Fix Guidr MongoDB data (dry-run by default)"
    )
    add_env_argument(parser)
    parser.add_argument("--apply", action="store_true", help="Actually apply changes")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("remove-orphans", help="Remove orphaned records")

    p_set = sub.add_parser("set-field", help="Set field value")
    p_set.add_argument("collection")
    p_set.add_argument("field")
    p_set.add_argument("value")
    p_set.add_argument("--filter", default=None)

    p_unset = sub.add_parser("unset-field", help="Remove a field")
    p_unset.add_argument("collection")
    p_unset.add_argument("field")
    p_unset.add_argument("--filter", default=None)

    p_rename = sub.add_parser("rename-field", help="Rename a field")
    p_rename.add_argument("collection")
    p_rename.add_argument("old_field")
    p_rename.add_argument("new_field")

    p_update = sub.add_parser("update", help="Run custom update")
    p_update.add_argument("collection")
    p_update.add_argument("--filter", default=None)
    p_update.add_argument("--update", required=True)

    p_delete = sub.add_parser("delete", help="Delete documents")
    p_delete.add_argument("collection")
    p_delete.add_argument("--filter", required=True)

    args = parser.parse_args()
    db = get_db(args)

    commands = {
        "remove-orphans": cmd_remove_orphans,
        "set-field": cmd_set_field,
        "unset-field": cmd_unset_field,
        "rename-field": cmd_rename_field,
        "update": cmd_update,
        "delete": cmd_delete,
    }
    commands[args.command](db, args)


if __name__ == "__main__":
    main()
