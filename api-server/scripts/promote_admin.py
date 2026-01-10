#!/usr/bin/env python3
"""Promote a user to admin status by email."""

import argparse
import asyncio
import sys

from motor.motor_asyncio import AsyncIOMotorClient

from src.infrastructure.config.settings import Settings


async def promote_user_to_admin(email: str) -> None:
    """Promote user to admin by email.

    Args:
        email: Email address of user to promote
    """
    settings = Settings()
    client = AsyncIOMotorClient(settings.mongodb_url)
    try:
        db = client[settings.mongodb_database]
        users_collection = db["users"]

        # Find user by email (case-insensitive)
        user = await users_collection.find_one({"email": email.lower()})
        if not user:
            print(f"Error: User not found with email: {email}")
            return

        # Update to admin
        result = await users_collection.update_one(
            {"_id": user["_id"]},
            {"$set": {"isAdmin": True}},
        )

        if result.modified_count > 0:
            print(f"Success: User {email} promoted to admin")
        else:
            print(f"Info: User {email} was already an admin")

    finally:
        client.close()


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Promote a user to admin status")
    parser.add_argument("email", help="Email address of user to promote")
    args = parser.parse_args()

    try:
        asyncio.run(promote_user_to_admin(args.email))
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
