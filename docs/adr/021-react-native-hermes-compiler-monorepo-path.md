# ADR-021: React Native Hermes Compiler Path Resolution in Monorepo

**Date**: 2026-02-02
**Status**: Accepted
**Context**: Multiple failed attempts to configure Hermes compiler in monorepo build
**Decision**: Set explicit `hermesCommand` path pointing to `hermes-compiler` NPM package

## Problem

The React Native Gradle plugin's Hermes compiler auto-detection was failing in CI/CD environments after monorepo restructuring. This caused Android builds to fail with:

```
Couldn't determine Hermesc location
```

### Root Cause Analysis

The Gradle plugin has a path resolution priority (from `PathUtils.kt:240`):

1. If `hermesCommand` is set → use it (with `%OS-BIN%` replacement)
2. Check built from source: `{projectRoot}/node_modules/react-native/ReactAndroid/hermes-engine/build/hermes/bin/hermesc`
3. Check NPM package: `{projectRoot}/node_modules/hermes-compiler/hermesc/%OS-BIN%/hermesc`
4. Throw error

**Key insight**: `projectRoot` = the value of the `root` parameter in `build.gradle`, NOT the location of `build.gradle` itself.

### Previous Incorrect Attempts

| Approach | Issue |
|----------|-------|
| `reactNativeDir = file("../../node_modules/react-native")` | Parameter NOT used for hermesc detection; created false belief it would help |
| `hermesCommand = file("../../../...")` | Using `file()` instead of string; confusion about directory depth |
| `hermesCommand = "../../../node_modules/react-native/sdks/hermesc/..."` | Wrong location - this directory doesn't exist |
| Tried various `../` depths | Confusion about whether paths were relative to `build.gradle` or `root` parameter |

All failures traced to **misunderstanding path resolution base**: paths in `hermesCommand` are resolved relative to the `root` parameter value, NOT relative to the `build.gradle` file location.

## Decision

Set explicit `hermesCommand` path using the correct location and depth:

**File**: `mobile/android/app/build.gradle`

```gradle
react {
    /* Folders */
    root = file("../../")  // Points to mobile/ directory

    /* Bundling */
    entryFile = file("../../index.js")

    /* Hermes Commands */
    hermesCommand = "../node_modules/hermes-compiler/hermesc/%OS-BIN%/hermesc"

    /* Removed */
    // reactNativeDir - not used for hermesc detection
}
```

### Why This Works

**Path resolution**:
- `root` = `file("../../")` = `mobile/` directory (from `mobile/android/app/`)
- `hermesCommand` = `../node_modules/hermes-compiler/hermesc/%OS-BIN%/hermesc`
- Plugin resolves: `{root}/{hermesCommand}` = `mobile/../node_modules/...` = monorepo root's `node_modules/hermes-compiler/hermesc/{linux64-bin|osx-bin|win64-bin}/hermesc` ✓

**Critical facts verified from source code**:
- Hermes binary is at `hermes-compiler` NPM package, NOT `react-native/sdks/hermesc/`
- `%OS-BIN%` is automatically replaced: `linux64-bin` (Linux), `osx-bin` (macOS), `win64-bin` (Windows)
- No symlink dependency (previously relied on `mobile/node_modules/hermes-compiler` which may not exist in CI)
- Works locally and in CI/CD environments

## Consequences

### Positive
- ✅ Explicit path configuration - no ambiguity in plugin behavior
- ✅ No symlink dependency - works consistently in all environments
- ✅ Works without `reactNativeDir` parameter - cleaner configuration
- ✅ Matches plugin's source code expectations (verified in `PathUtils.kt`)
- ✅ Platform-agnostic with `%OS-BIN%` placeholder handling

### Negative
- None identified (this is the correct approach per React Native's own code)

## Lessons Learned

### 1. Reading Source Code is Essential
- Error message: "Couldn't determine Hermesc location" misleadingly suggested `react-native/sdks/hermesc/`
- Reality: Plugin actually looks for `hermes-compiler` package (verified in `PathUtils.kt:240`)
- Documentation was incomplete; only source code revealed the truth

### 2. Understanding Path Resolution Bases
- Path confusion caused ~6 failed attempts
- Critical: `hermesCommand` paths are relative to `root` parameter, NOT `build.gradle` file location
- This distinction was not obvious from documentation

### 3. Gradle Parameter Semantics
- `reactNativeDir` is NOT used for Hermes detection (only for React Native location)
- `hermesCommand` can be either string (relative to `root`) or file() function (absolute)
- String paths are simpler for monorepo scenarios

## References

- **Source**: React Native Gradle Plugin `PathUtils.kt:240`
  ```kotlin
  private const val HERMES_COMPILER_NPM_DIR = "node_modules/hermes-compiler/hermesc/%OS-BIN%/"
  ```
- **Related ADRs**: [ADR-013](./013-ios-testflight-build-optimization.md) (platform-specific build paths)
- **CI/CD**: GitHub Actions Android Release workflow relies on this path resolution

## Verification

### Local Testing
```bash
# 1. Verify hermesc binary exists
ls -lh node_modules/hermes-compiler/hermesc/linux64-bin/hermesc
# Expected: ~3.7MB executable

# 2. Build locally
cd mobile
./android/gradlew clean assembleRelease --no-daemon --stacktrace -p android

# 3. Expected output
# > Task :app:createBundleReleaseJsAndAssets SUCCESS
```

### CI Testing
After pushing, GitHub Actions workflow should show:
```
LOG:Writing bundle output to: .../index.android.bundle
LOG:Done writing bundle output
> Task :app:createBundleReleaseJsAndAssets SUCCESS
BUILD SUCCESSFUL
```
