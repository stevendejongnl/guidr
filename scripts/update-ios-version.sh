#!/bin/bash
# Update iOS MARKETING_VERSION in Xcode project
# Usage: ./update-ios-version.sh <version>

set -e

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "Error: Version argument required"
  echo "Usage: $0 <version>"
  exit 1
fi

PROJECT_FILE="ios/guidr.xcodeproj/project.pbxproj"

if [ ! -f "$PROJECT_FILE" ]; then
  echo "Error: $PROJECT_FILE not found"
  exit 1
fi

echo "Updating iOS version to $VERSION"

# Update MARKETING_VERSION in project.pbxproj
# Use temp file for portability (works on both macOS and Linux)
sed "s/MARKETING_VERSION = [^;]*/MARKETING_VERSION = $VERSION/" "$PROJECT_FILE" > "$PROJECT_FILE.tmp"
mv "$PROJECT_FILE.tmp" "$PROJECT_FILE"

echo "✓ iOS version updated to $VERSION in $PROJECT_FILE"
