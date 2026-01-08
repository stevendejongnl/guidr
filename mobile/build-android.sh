#!/bin/bash
# Wrapper script to build Android app with proper environment
unset NPM_CONFIG_PREFIX
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk
cd "$(dirname "$0")"

# Sync version from package.json before building
../scripts/sync-version.sh

./android/gradlew assembleDebug -p android "$@"
