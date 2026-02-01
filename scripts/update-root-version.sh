#!/bin/bash
# Update root package.json version
# Usage: ./update-root-version.sh <version>

set -e

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "Error: Version argument required"
  echo "Usage: $0 <version>"
  exit 1
fi

# Auto-detect location (support both old and new structure)
if [ -f "package.json" ]; then
  PKG_FILE="package.json"
elif [ -f "../package.json" ]; then
  PKG_FILE="../package.json"
else
  echo "Error: package.json not found in current directory or parent directory"
  exit 1
fi

echo "Updating root package.json version to $VERSION"

# Update version in package.json using sed
# Use temp file for portability (works on both macOS and Linux)
sed "s/\"version\": \"[^\"]*\"/\"version\": \"$VERSION\"/" "$PKG_FILE" > "$PKG_FILE.tmp"
mv "$PKG_FILE.tmp" "$PKG_FILE"

echo "✓ Root package.json version updated to $VERSION in $PKG_FILE"
