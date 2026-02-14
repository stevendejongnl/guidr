#!/usr/bin/env python3
"""MongoDB query tool for Guidr database.

Usage:
    python query.py collections                          # List all collections
    python query.py count <collection>                   # Count documents
    python query.py count <collection> --filter '{"key": "val"}'
    python query.py find <collection>                    # Find all (limit 20)
    python query.py find <collection> --filter '{"userId": "abc"}'
    python query.py find <collection> --filter '...' --project '{"name": 1}'
    python query.py find <collection> --limit 5 --skip 10
    python query.py find <collection> --sort '{"createdAt": -1}'
    python query.py distinct <collection> <field>        # Distinct values
    python query.py aggregate <collection> --pipeline '[{"$group": ...}]'
    python query.py indexes <collection>                 # Show indexes
"""

import argparse
import json
import sys
from datetime import datetime

from bson import ObjectId

sys.path.insert(0, str(__import__("pathlib").Path(__file__).parent))
from connection import add_env_argument, get_db


def json_serialize(obj):
    if isinstance(obj, ObjectId):
        return str(obj)
    if isinstance(obj, datetime):
        return obj.isoformat()
    if isinstance(obj, bytes):
        return obj.hex()
    return str(obj)


def print_docs(docs, compact=False):
    for doc in docs:
        print(json.dumps(doc, default=json_serialize, indent=None if compact else 2))
        if not compact:
            print()


def cmd_collections(db, _args):
    names = sorted(db.list_collection_names())
    for name in names:
        count = db[name].estimated_document_count()
        print(f"  {name}: {count} documents")


def cmd_count(db, args):
    coll = db[args.collection]
    filt = json.loads(args.filter) if args.filter else {}
    count = coll.count_documents(filt)
    print(f"{count} documents in '{args.collection}'")
    if args.filter:
        print(f"  filter: {args.filter}")


def cmd_find(db, args):
    coll = db[args.collection]
    filt = json.loads(args.filter) if args.filter else {}
    proj = json.loads(args.project) if args.project else None
    sort = json.loads(args.sort) if args.sort else None

    cursor = coll.find(filt, proj)
    if sort:
        cursor = cursor.sort(list(sort.items()))
    if args.skip:
        cursor = cursor.skip(args.skip)
    cursor = cursor.limit(args.limit)

    docs = list(cursor)
    print(f"Found {len(docs)} documents (limit {args.limit}):")
    print()
    print_docs(docs, compact=args.compact)


def cmd_distinct(db, args):
    coll = db[args.collection]
    filt = json.loads(args.filter) if args.filter else {}
    values = coll.distinct(args.field, filt)
    print(f"Distinct '{args.field}' in '{args.collection}': {len(values)} values")
    for v in sorted(values, key=str):
        print(f"  {json.dumps(v, default=json_serialize)}")


def cmd_aggregate(db, args):
    coll = db[args.collection]
    pipeline = json.loads(args.pipeline)
    results = list(coll.aggregate(pipeline))
    print(f"Aggregate returned {len(results)} results:")
    print()
    print_docs(results, compact=args.compact)


def cmd_indexes(db, args):
    coll = db[args.collection]
    indexes = coll.index_information()
    print(f"Indexes on '{args.collection}':")
    for name, info in indexes.items():
        keys = info.get("key", [])
        unique = " (unique)" if info.get("unique") else ""
        print(f"  {name}: {keys}{unique}")


def main():
    parser = argparse.ArgumentParser(description="Query Guidr MongoDB")
    add_env_argument(parser)
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("collections", help="List collections")

    p_count = sub.add_parser("count", help="Count documents")
    p_count.add_argument("collection")
    p_count.add_argument("--filter", default=None)

    p_find = sub.add_parser("find", help="Find documents")
    p_find.add_argument("collection")
    p_find.add_argument("--filter", default=None)
    p_find.add_argument("--project", default=None)
    p_find.add_argument("--sort", default=None)
    p_find.add_argument("--limit", type=int, default=20)
    p_find.add_argument("--skip", type=int, default=0)
    p_find.add_argument("--compact", action="store_true")

    p_distinct = sub.add_parser("distinct", help="Distinct values")
    p_distinct.add_argument("collection")
    p_distinct.add_argument("field")
    p_distinct.add_argument("--filter", default=None)

    p_agg = sub.add_parser("aggregate", help="Run aggregation pipeline")
    p_agg.add_argument("collection")
    p_agg.add_argument("--pipeline", required=True)
    p_agg.add_argument("--compact", action="store_true")

    p_idx = sub.add_parser("indexes", help="Show indexes")
    p_idx.add_argument("collection")

    args = parser.parse_args()
    db = get_db(args)

    commands = {
        "collections": cmd_collections,
        "count": cmd_count,
        "find": cmd_find,
        "distinct": cmd_distinct,
        "aggregate": cmd_aggregate,
        "indexes": cmd_indexes,
    }
    commands[args.command](db, args)


if __name__ == "__main__":
    main()
