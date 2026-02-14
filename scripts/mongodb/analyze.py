#!/usr/bin/env python3
"""MongoDB data analysis tool for Guidr database.

Usage:
    python analyze.py stats                    # Collection stats overview
    python analyze.py schema <collection>      # Analyze document schema
    python analyze.py orphans                  # Find orphaned records
    python analyze.py integrity                # Full integrity check
    python analyze.py duplicates <collection> <field>  # Find duplicate values
"""

import argparse
import json
import sys
from collections import Counter, defaultdict
from datetime import datetime

from bson import ObjectId

sys.path.insert(0, str(__import__("pathlib").Path(__file__).parent))
from connection import add_env_argument, get_db


def json_serialize(obj):
    if isinstance(obj, ObjectId):
        return str(obj)
    if isinstance(obj, datetime):
        return obj.isoformat()
    return str(obj)


def cmd_stats(db, _args):
    print("Collection Statistics")
    print("=" * 60)
    for name in sorted(db.list_collection_names()):
        coll = db[name]
        count = coll.estimated_document_count()
        stats = db.command("collStats", name)
        size_kb = stats.get("size", 0) / 1024
        avg_size = stats.get("avgObjSize", 0)
        indexes = stats.get("nindexes", 0)
        print(f"\n  {name}:")
        print(f"    Documents: {count}")
        print(f"    Size: {size_kb:.1f} KB (avg {avg_size:.0f} bytes/doc)")
        print(f"    Indexes: {indexes}")


def cmd_schema(db, args):
    coll = db[args.collection]
    sample_size = args.sample
    total = coll.estimated_document_count()

    if total == 0:
        print(f"Collection '{args.collection}' is empty")
        return

    docs = list(coll.find().limit(sample_size))
    sampled = len(docs)

    field_types = defaultdict(Counter)
    field_presence = Counter()

    def analyze_fields(doc, prefix=""):
        for key, value in doc.items():
            full_key = f"{prefix}{key}" if not prefix else f"{prefix}.{key}"
            field_presence[full_key] += 1
            field_types[full_key][type(value).__name__] += 1
            if isinstance(value, dict) and key != "_id":
                analyze_fields(value, full_key)

    for doc in docs:
        analyze_fields(doc)

    print(f"Schema Analysis: '{args.collection}' ({sampled}/{total} docs sampled)")
    print("=" * 70)
    for field in sorted(field_presence.keys()):
        presence = field_presence[field]
        pct = (presence / sampled) * 100
        types = ", ".join(
            f"{t}({c})" for t, c in field_types[field].most_common()
        )
        optional = " [optional]" if pct < 100 else ""
        print(f"  {field}: {types} ({pct:.0f}%){optional}")


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


def cmd_orphans(db, _args):
    print("Orphan Analysis")
    print("=" * 60)
    issues_found = False

    for child_coll, rel in KNOWN_RELATIONS.items():
        if child_coll not in db.list_collection_names():
            continue

        parent_ids = set()
        for doc in db[rel["parent_collection"]].find({}, {rel["parent_field"]: 1}):
            if rel["parent_field"] in doc:
                parent_ids.add(doc[rel["parent_field"]])

        orphans = []
        for doc in db[child_coll].find({}, {rel["foreign_field"]: 1, "_id": 1}):
            fk = doc.get(rel["foreign_field"])
            if fk and fk not in parent_ids:
                orphans.append({"_id": str(doc["_id"]), rel["foreign_field"]: fk})

        if orphans:
            issues_found = True
            print(f"\n  {child_coll}: {len(orphans)} orphaned records")
            print(f"    Missing parent: {rel['parent_collection']}.{rel['parent_field']}")
            for o in orphans[:5]:
                print(f"    - {json.dumps(o)}")
            if len(orphans) > 5:
                print(f"    ... and {len(orphans) - 5} more")
        else:
            print(f"\n  {child_coll}: OK (no orphans)")

    if not issues_found:
        print("\nAll referential integrity checks passed.")


def cmd_integrity(db, _args):
    print("Full Integrity Check")
    print("=" * 60)
    issues = []

    # Check required fields per collection
    required_fields = {
        "users": ["id", "email", "role"],
        "guides": ["id", "userId", "title", "guideTypeId"],
        "steps": ["id", "guideId", "title", "order"],
        "sessions": ["id", "guideId", "userId", "status"],
    }

    for coll_name, fields in required_fields.items():
        if coll_name not in db.list_collection_names():
            continue
        coll = db[coll_name]
        for field in fields:
            missing = coll.count_documents(
                {"$or": [{field: {"$exists": False}}, {field: None}]}
            )
            if missing > 0:
                issues.append(f"{coll_name}: {missing} docs missing '{field}'")

    # Check session status values
    if "sessions" in db.list_collection_names():
        valid_statuses = ["not_started", "in_progress", "paused", "completed"]
        invalid = db["sessions"].count_documents(
            {"status": {"$nin": valid_statuses}}
        )
        if invalid > 0:
            issues.append(f"sessions: {invalid} docs with invalid status")

    # Check user roles
    if "users" in db.list_collection_names():
        valid_roles = ["user", "admin"]
        invalid = db["users"].count_documents(
            {"role": {"$nin": valid_roles}}
        )
        if invalid > 0:
            issues.append(f"users: {invalid} docs with invalid role")

    # Orphan check
    print("\nReferential integrity:")
    cmd_orphans(db, _args)

    print("\n\nField validation:")
    if issues:
        for issue in issues:
            print(f"  ISSUE: {issue}")
    else:
        print("  All field checks passed.")


def cmd_duplicates(db, args):
    coll = db[args.collection]
    pipeline = [
        {"$group": {"_id": f"${args.field}", "count": {"$sum": 1}}},
        {"$match": {"count": {"$gt": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 50},
    ]
    results = list(coll.aggregate(pipeline))
    if results:
        print(f"Duplicate '{args.field}' values in '{args.collection}':")
        for r in results:
            print(f"  {json.dumps(r['_id'], default=json_serialize)}: {r['count']} occurrences")
    else:
        print(f"No duplicates found for '{args.field}' in '{args.collection}'")


def main():
    parser = argparse.ArgumentParser(description="Analyze Guidr MongoDB data")
    add_env_argument(parser)
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("stats", help="Collection statistics")

    p_schema = sub.add_parser("schema", help="Analyze document schema")
    p_schema.add_argument("collection")
    p_schema.add_argument("--sample", type=int, default=100)

    sub.add_parser("orphans", help="Find orphaned records")
    sub.add_parser("integrity", help="Full integrity check")

    p_dup = sub.add_parser("duplicates", help="Find duplicate values")
    p_dup.add_argument("collection")
    p_dup.add_argument("field")

    args = parser.parse_args()
    db = get_db(args)

    commands = {
        "stats": cmd_stats,
        "schema": cmd_schema,
        "orphans": cmd_orphans,
        "integrity": cmd_integrity,
        "duplicates": cmd_duplicates,
    }
    commands[args.command](db, args)


if __name__ == "__main__":
    main()
