#!/usr/bin/env python3
"""
Script to clean up GitHub Container Registry (ghcr.io) package versions.

This script:
1. Removes all versions from guidr-api-server EXCEPT 1.18.2
2. Completely removes all versions from guidr-test-server

Usage:
  python cleanup-container-images.py [--dry-run] [--verbose|-v]

Options:
  --dry-run    Show what would be deleted without making changes
  --verbose    Show detailed API request/response output for debugging
  -v           Same as --verbose

Requirements:
- GitHub CLI (gh) installed and authenticated
- Token needs 'read:packages' and 'delete:packages' scopes. To add them:
  gh auth refresh -s read:packages,delete:packages
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
    def parse(cls, version_str: str) -> "Version | None":
        """Parse a version string like 'v1.18.2' or '1.18.2' into a Version tuple."""
        match = re.match(r"v?(\d+)\.(\d+)\.(\d+)", version_str)
        if not match:
            return None
        return cls(int(match.group(1)), int(match.group(2)), int(match.group(3)))


# Configuration
OWNER = "stevendejongnl"
REPO = "guidr"

# Packages to clean up
PACKAGES = {
    "guidr-api-server": {
        "keep_versions": ["1.18.2"],  # Keep these versions (and their tags like 'latest')
        "delete_all": False,
    },
    "guidr-test-server": {
        "keep_versions": [],
        "delete_all": True,  # Remove everything
    },
}


# Global verbose flag
VERBOSE = False


def run_gh_command(args: list[str], check: bool = True) -> tuple[str, str, int]:
    """Run a GitHub CLI command and return (stdout, stderr, returncode)."""
    if VERBOSE:
        print(f"  [DEBUG] Running: gh {' '.join(args)}")

    result = subprocess.run(
        ["gh"] + args,
        capture_output=True,
        text=True,
        check=False,  # We handle errors ourselves
    )

    if VERBOSE:
        if result.stdout.strip():
            print(f"  [DEBUG] stdout: {result.stdout[:200]}{'...' if len(result.stdout) > 200 else ''}")
        if result.stderr.strip():
            print(f"  [DEBUG] stderr: {result.stderr[:200]}{'...' if len(result.stderr) > 200 else ''}")
        print(f"  [DEBUG] returncode: {result.returncode}")

    if result.returncode != 0 and check:
        raise subprocess.CalledProcessError(result.returncode, ["gh"] + args, result.stdout, result.stderr)

    return result.stdout, result.stderr, result.returncode


def list_all_packages() -> list[dict]:
    """List all container packages for the user - for diagnostic purposes."""
    print("\n📦 Listing all container packages...")
    stdout, stderr, returncode = run_gh_command([
        "api",
        f"/users/{OWNER}/packages?package_type=container",
    ], check=False)

    if returncode != 0:
        print(f"  ❌ Failed to list packages: {stderr.strip()}")
        return []

    if not stdout.strip():
        print("  No packages found")
        return []

    try:
        packages = json.loads(stdout)
        if packages:
            print(f"  Found {len(packages)} package(s):")
            for pkg in packages:
                print(f"    - {pkg.get('name', 'unknown')} (id: {pkg.get('id', '?')})")
        return packages if isinstance(packages, list) else []
    except json.JSONDecodeError as e:
        print(f"  ❌ Failed to parse response: {e}")
        return []


def get_package_versions(package_name: str) -> list[dict]:
    """Get all versions of a container package."""
    # Use the GitHub API to list package versions
    stdout, stderr, returncode = run_gh_command([
        "api",
        f"/users/{OWNER}/packages/container/{package_name}/versions",
        "--paginate",
    ], check=False)

    if returncode != 0:
        error_msg = stderr.strip()
        if "404" in error_msg or "Not Found" in error_msg:
            print(f"  ⚠️  Package '{package_name}' not found (404)")
            print(f"     This could mean: package doesn't exist, or wrong owner/name")
        elif "403" in error_msg or "Forbidden" in error_msg:
            print(f"  ❌ Permission denied (403) for package '{package_name}'")
            print(f"     Ensure your token has 'read:packages' scope")
        else:
            print(f"  ❌ API error: {error_msg}")
        return []

    if not stdout.strip():
        return []

    try:
        versions = json.loads(stdout)
        return versions if isinstance(versions, list) else []
    except json.JSONDecodeError as e:
        print(f"  ❌ Error parsing versions for {package_name}: {e}")
        return []


def delete_package_version(package_name: str, version_id: int, dry_run: bool = False) -> bool:
    """Delete a specific package version."""
    if dry_run:
        return True

    stdout, stderr, returncode = run_gh_command([
        "api",
        "--method", "DELETE",
        f"/users/{OWNER}/packages/container/{package_name}/versions/{version_id}",
    ], check=False)

    if returncode != 0:
        print(f"    ❌ Error deleting version {version_id}: {stderr.strip()}")
        return False
    return True


def should_keep_version(version_info: dict, keep_versions: list[str]) -> bool:
    """Determine if a package version should be kept."""
    tags = version_info.get("metadata", {}).get("container", {}).get("tags", [])

    # Check if any of the tags match versions we want to keep
    for tag in tags:
        # Keep if tag exactly matches a keep version
        if tag in keep_versions:
            return True
        # Also keep 'latest' if we're keeping any versions
        if tag == "latest" and keep_versions:
            return True

    return False


def format_version_info(version_info: dict) -> str:
    """Format version info for display."""
    version_id = version_info.get("id", "unknown")
    tags = version_info.get("metadata", {}).get("container", {}).get("tags", [])
    created_at = version_info.get("created_at", "unknown")[:10]  # Just the date

    tags_str = ", ".join(tags) if tags else "<untagged>"
    return f"ID: {version_id}, Tags: [{tags_str}], Created: {created_at}"


def cleanup_package(package_name: str, config: dict, dry_run: bool) -> tuple[int, int]:
    """Clean up a single package. Returns (deleted_count, skipped_count)."""
    print(f"\n{'=' * 60}")
    print(f"Package: {package_name}")
    print(f"{'=' * 60}")

    keep_versions = config["keep_versions"]
    delete_all = config["delete_all"]

    if delete_all:
        print("Action: DELETE ALL VERSIONS")
    else:
        print(f"Action: Keep only versions: {keep_versions}")

    versions = get_package_versions(package_name)

    if not versions:
        print("  No versions found (or package doesn't exist)")
        return 0, 0

    print(f"  Found {len(versions)} version(s)\n")

    deleted = 0
    skipped = 0

    for version in versions:
        version_id = version.get("id")
        info_str = format_version_info(version)

        if not delete_all and should_keep_version(version, keep_versions):
            print(f"  [KEEP] {info_str}")
            skipped += 1
            continue

        if dry_run:
            print(f"  [DRY-RUN] Would delete: {info_str}")
            deleted += 1
        else:
            print(f"  [DELETE] {info_str}")
            if delete_package_version(package_name, version_id, dry_run):
                deleted += 1
            else:
                print(f"    Failed to delete version {version_id}")

    return deleted, skipped


def check_token_scope() -> bool:
    """Check if the token has required package scopes."""
    print("Checking GitHub token scopes...")
    try:
        stdout, stderr, returncode = run_gh_command(["auth", "status"], check=False)
        combined = stdout + stderr

        missing_scopes = []

        # Check for read:packages scope (required to list packages)
        if "read:packages" not in combined:
            missing_scopes.append("read:packages")

        # Check for delete:packages scope (required to delete packages)
        if "delete:packages" not in combined:
            missing_scopes.append("delete:packages")

        if missing_scopes:
            print(f"\n❌ ERROR: Your token is missing required scope(s): {', '.join(missing_scopes)}")
            print("\n   Run this command to add the required scopes:")
            print(f"   gh auth refresh -s {','.join(missing_scopes)}")
            print("\n   Or add all package scopes at once:")
            print("   gh auth refresh -s read:packages,delete:packages\n")
            return False

        print("  ✓ Token has required scopes")
        return True
    except Exception as e:
        print(f"  ⚠️ Could not check token scopes: {e}")
        return True  # Continue anyway, API will fail if scopes are missing


def main():
    global VERBOSE
    dry_run = "--dry-run" in sys.argv
    VERBOSE = "--verbose" in sys.argv or "-v" in sys.argv

    print("GitHub Container Registry Cleanup Script")
    print("=" * 60)

    if dry_run:
        print("\n🔍 DRY RUN MODE - No changes will be made\n")
    else:
        print("\n⚠️  LIVE MODE - Versions will be permanently deleted!\n")

    if VERBOSE:
        print("🔊 VERBOSE MODE enabled\n")

    # Check token scope
    if not check_token_scope():
        print("Please add the required scopes and try again.")
        sys.exit(1)

    # List all packages first for diagnostics
    list_all_packages()

    total_deleted = 0
    total_skipped = 0

    for package_name, config in PACKAGES.items():
        deleted, skipped = cleanup_package(package_name, config, dry_run)
        total_deleted += deleted
        total_skipped += skipped

    print(f"\n{'=' * 60}")
    print("SUMMARY")
    print(f"{'=' * 60}")
    print(f"  Versions {'would be ' if dry_run else ''}deleted: {total_deleted}")
    print(f"  Versions kept: {total_skipped}")

    if dry_run:
        print("\n💡 Run without --dry-run to actually delete the versions.")
        print("   Make sure you have the delete:packages scope:")
        print("   gh auth refresh -s delete:packages")


if __name__ == "__main__":
    main()

