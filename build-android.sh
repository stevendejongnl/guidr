#!/bin/bash
# Wrapper script to build Android app with proper environment
unset NPM_CONFIG_PREFIX
cd "$(dirname "$0")"
# Build without CMake (skip native libraries for now)
./android/gradlew assembleDebug -p android -PskipCmake=true "$@"
