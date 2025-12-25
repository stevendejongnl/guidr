#!/bin/bash
# Local iOS simulator build script
# Usage: ./build-ios-simulator.sh

set -e

echo "Building iOS app for simulator..."

cd "$(dirname "$0")/ios"

echo "Installing CocoaPods dependencies..."
pod install

echo "Building with xcodebuild..."
xcodebuild \
  -workspace guidr.xcworkspace \
  -scheme guidr \
  -sdk iphonesimulator \
  -configuration Debug \
  -destination 'platform=iOS Simulator,name=iPhone 15' \
  build \
  CODE_SIGNING_ALLOWED=NO

echo "✓ Build complete"
echo "App location: ios/build/Build/Products/Debug-iphonesimulator/guidr.app"
