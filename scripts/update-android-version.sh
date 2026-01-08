#!/bin/bash
# Update Android versionName and versionCode in build.gradle
# Usage: ./update-android-version.sh <version>

set -e

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "Error: Version argument required"
  echo "Usage: $0 <version>"
  exit 1
fi

# Auto-detect location (support both old and new structure)
if [ -f "mobile/android/app/build.gradle" ]; then
  BUILD_GRADLE="mobile/android/app/build.gradle"
elif [ -f "android/app/build.gradle" ]; then
  BUILD_GRADLE="android/app/build.gradle"
else
  echo "Error: build.gradle not found in android/app/ or mobile/android/app/"
  exit 1
fi

echo "Updating Android version to $VERSION"

# Extract current versionCode and increment it
CURRENT_VERSION_CODE=$(grep -E '^\s*versionCode\s+[0-9]+' "$BUILD_GRADLE" | sed -E 's/.*versionCode\s+([0-9]+).*/\1/' | tr -d '[:space:]')

# Validate it's a number, default to 0 if not
if ! [[ "$CURRENT_VERSION_CODE" =~ ^[0-9]+$ ]]; then
  echo "Warning: Could not extract versionCode, defaulting to 0"
  CURRENT_VERSION_CODE=0
fi

NEW_VERSION_CODE=$((CURRENT_VERSION_CODE + 1))

# Update versionCode
sed -E "s/(versionCode\s+)[0-9]+/\1$NEW_VERSION_CODE/" "$BUILD_GRADLE" > "$BUILD_GRADLE.tmp"
mv "$BUILD_GRADLE.tmp" "$BUILD_GRADLE"

# Update versionName
sed -E "s/(versionName\s+)\"[^\"]+\"/\1\"$VERSION\"/" "$BUILD_GRADLE" > "$BUILD_GRADLE.tmp"
mv "$BUILD_GRADLE.tmp" "$BUILD_GRADLE"

echo "✓ Android version updated to $VERSION (versionCode: $NEW_VERSION_CODE) in $BUILD_GRADLE"
