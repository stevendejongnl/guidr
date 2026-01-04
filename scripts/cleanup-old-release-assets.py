#!/usr/bin/env python3
"""
Script to remove assets from GitHub releases older than a specified version.
Usage: python cleanup-old-release-assets.py [--dry-run]
"""

import subprocess
import json
import sys
import re
from typing import NamedTuple


class Version(NamedTuple):
    major: int
    minor: int
    patch: int

    @classmethod
    def parse(cls, version_str: str) -> "Version":
        """Parse a version string like 'v1.18.2' into a Version tuple."""
        match = re.match(r"v?(\d+)\.(\d+)\.(\d+)", version_str)
        if not match:
            raise ValueError(f"Invalid version string: {version_str}")
        return cls(int(match.group(1)), int(match.group(2)), int(match.group(3)))


REPO = "stevendejongnl/guidr"
KEEP_VERSION = Version.parse("v1.18.2")  # Keep this version and newer


def run_gh_command(args: list[str]) -> str:
    """Run a GitHub CLI command and return the output."""
    result = subprocess.run(
        ["gh"] + args,
        capture_output=True,
        text=True,
        check=True,
    )
    return result.stdout


def get_releases() -> list[dict]:
    """Get all releases from the repository."""
    output = run_gh_command([
        "release", "list",
        "-R", REPO,
        "--limit", "100",
        "--json", "tagName,name"
    ])
    return json.loads(output)


def get_release_assets(tag: str) -> list[dict]:
    """Get assets for a specific release."""
    try:
        output = run_gh_command([
            "api",
            f"repos/{REPO}/releases/tags/{tag}",
            "--jq", ".assets"
        ])
        return json.loads(output) if output.strip() else []
    except (subprocess.CalledProcessError, json.JSONDecodeError):
        return []


def delete_asset(tag: str, asset_name: str, dry_run: bool = False) -> bool:
    """Delete an asset from a release."""
    if dry_run:
        print(f"  [DRY-RUN] Would delete: {asset_name}")
        return True

    try:
        run_gh_command([
            "release", "delete-asset",
            tag,
            asset_name,
            "-R", REPO,
            "-y"
        ])
        print(f"  Deleted: {asset_name}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"  Error deleting {asset_name}: {e}")
        return False


def main():
    dry_run = "--dry-run" in sys.argv

    if dry_run:
        print("=== DRY RUN MODE - No changes will be made ===\n")

    print(f"Fetching releases from {REPO}...")
    releases = get_releases()
    print(f"Found {len(releases)} releases\n")

    # Filter to releases older than KEEP_VERSION
    old_releases = []
    for release in releases:
        tag = release["tagName"]
        try:
            version = Version.parse(tag)
            if version < KEEP_VERSION:
                old_releases.append(release)
        except ValueError:
            print(f"Skipping invalid version tag: {tag}")

    print(f"Releases older than v{KEEP_VERSION.major}.{KEEP_VERSION.minor}.{KEEP_VERSION.patch}: {len(old_releases)}\n")

    total_assets_deleted = 0
    releases_with_assets = 0

    for release in old_releases:
        tag = release["tagName"]
        assets = get_release_assets(tag)

        if not assets:
            continue

        releases_with_assets += 1
        print(f"\n{tag}: {len(assets)} asset(s)")

        for asset in assets:
            asset_name = asset["name"]
            if delete_asset(tag, asset_name, dry_run):
                total_assets_deleted += 1

    print(f"\n{'=' * 50}")
    print(f"Summary:")
    print(f"  Releases processed with assets: {releases_with_assets}")
    print(f"  Total assets {'would be ' if dry_run else ''}deleted: {total_assets_deleted}")

    if dry_run:
        print("\nRun without --dry-run to actually delete the assets.")


if __name__ == "__main__":
    main()

