"""Shared MongoDB connection helper for Guidr scripts.

Supports environment switching via --env flag or environment variables.
"""

import os
import sys

from pymongo import MongoClient

ENVIRONMENTS = {
    "local": {
        "url": "mongodb://localhost:27017",
        "database": "guidr_test",
    },
    "production": {
        "url_env": "MONGODB_PRODUCTION_URL",
        "database": "guidr_production",
    },
}


def add_env_argument(parser):
    """Add --env argument to an argparse parser."""
    parser.add_argument(
        "--env",
        choices=["local", "production"],
        default=None,
        help="Target environment (overrides MONGODB_URL/MONGODB_DATABASE)",
    )


def get_db(args=None):
    """Get a MongoDB database connection.

    Priority:
    1. --env flag (if provided)
    2. MONGODB_URL / MONGODB_DATABASE environment variables
    3. Default to local
    """
    env = getattr(args, "env", None) if args else None

    if env == "production":
        prod_url = os.environ.get(ENVIRONMENTS["production"]["url_env"])
        if not prod_url:
            print(
                f"ERROR: Set {ENVIRONMENTS['production']['url_env']} in .envrc "
                "for production access",
                file=sys.stderr,
            )
            sys.exit(1)
        url = prod_url
        database = ENVIRONMENTS["production"]["database"]
        print(f"[production] {database}", file=sys.stderr)
    elif env == "local":
        url = ENVIRONMENTS["local"]["url"]
        database = ENVIRONMENTS["local"]["database"]
        print(f"[local] {database}", file=sys.stderr)
    else:
        url = os.environ.get("MONGODB_URL", ENVIRONMENTS["local"]["url"])
        database = os.environ.get("MONGODB_DATABASE", ENVIRONMENTS["local"]["database"])

    client = MongoClient(url, serverSelectionTimeoutMS=5000)

    # Verify connection
    try:
        client.admin.command("ping")
    except Exception as e:
        print(f"ERROR: Cannot connect to MongoDB at {_mask_url(url)}: {e}", file=sys.stderr)
        sys.exit(1)

    return client[database]


def _mask_url(url):
    """Mask credentials in MongoDB URL for safe logging."""
    if "@" in url:
        prefix = url.split("://")[0]
        after_at = url.split("@", 1)[1]
        return f"{prefix}://***:***@{after_at}"
    return url
