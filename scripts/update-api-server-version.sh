#!/bin/bash
# Update api-server version in pyproject.toml
# Usage: ./update-api-server-version.sh <version>

set -e

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "Error: Version argument required"
  echo "Usage: $0 <version>"
  exit 1
fi

# Auto-detect location (support both old and new structure)
if [ -f "api-server/pyproject.toml" ]; then
  PYPROJECT_FILE="api-server/pyproject.toml"
elif [ -f "../api-server/pyproject.toml" ]; then
  PYPROJECT_FILE="../api-server/pyproject.toml"
else
  echo "Error: pyproject.toml not found in api-server/ or ../api-server/"
  exit 1
fi

echo "Updating api-server version to $VERSION"

# Update version in pyproject.toml
# Use temp file for portability (works on both macOS and Linux)
sed "s/^version = \"[^\"]*\"/version = \"$VERSION\"/" "$PYPROJECT_FILE" > "$PYPROJECT_FILE.tmp"
mv "$PYPROJECT_FILE.tmp" "$PYPROJECT_FILE"

echo "✓ API-server version updated to $VERSION in $PYPROJECT_FILE"
