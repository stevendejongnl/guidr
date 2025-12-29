#!/bin/bash
# Sync version from package.json to Android build.gradle and iOS project.pbxproj
# Usage: ./sync-version.sh [version]
# If version is not provided, it reads from package.json

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Get version from argument or package.json
if [ -n "$1" ]; then
  VERSION="$1"
else
  VERSION=$(grep '"version"' "$PROJECT_ROOT/package.json" | head -1 | sed 's/.*: "\(.*\)".*/\1/')
fi

if [ -z "$VERSION" ]; then
  echo "Error: Could not determine version"
  exit 1
fi

echo "Syncing version to $VERSION"

# Update Android build.gradle (versionName only)
BUILD_GRADLE="$PROJECT_ROOT/android/app/build.gradle"
if [ -f "$BUILD_GRADLE" ]; then
  sed -E "s/(versionName\s+)\"[^\"]+\"/\1\"$VERSION\"/" "$BUILD_GRADLE" > "$BUILD_GRADLE.tmp"
  mv "$BUILD_GRADLE.tmp" "$BUILD_GRADLE"
  echo "✓ Android versionName updated to $VERSION"
else
  echo "⚠ Android build.gradle not found at $BUILD_GRADLE"
fi

# Update iOS project.pbxproj (MARKETING_VERSION)
PROJECT_FILE="$PROJECT_ROOT/ios/guidr.xcodeproj/project.pbxproj"
if [ -f "$PROJECT_FILE" ]; then
  sed "s/MARKETING_VERSION = [^;]*/MARKETING_VERSION = $VERSION/" "$PROJECT_FILE" > "$PROJECT_FILE.tmp"
  mv "$PROJECT_FILE.tmp" "$PROJECT_FILE"
  echo "✓ iOS MARKETING_VERSION updated to $VERSION"
else
  echo "⚠ iOS project.pbxproj not found at $PROJECT_FILE"
fi

echo "✓ Version sync complete: $VERSION"

