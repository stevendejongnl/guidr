# CI/CD Troubleshooting Guide

## Overview

This guide documents common CI/CD failures and their root causes, particularly related to npm workspace restructuring and monorepo configuration.

---

## Issue: TestFlight Build Fails with Missing Source Map

### Symptoms

The TestFlight workflow fails during the iOS archive build with an error like:

```
Sentry Logger [error]: Source map file does not exist at ... main.jsbundle.map
** ARCHIVE FAILED **
```

The error appears to be code-signing related (fastlane match shows "There are no local code signing identities found"), but that's a **red herring** - fastlane recovers from that error automatically.

### Root Cause

After npm workspace restructuring (moving to a monorepo with `@guidr/shared` package), the Metro bundler fails to resolve the `@guidr/shared` dependency during the iOS build. This breaks the JavaScript bundle compilation, resulting in a missing source map file.

**Why it looks like code signing:**
- Fastlane match temporarily cannot find code signing identities in the initial keychain
- This error message appears first in the logs
- However, fastlane automatically imports certificates and continues
- The build then fails much later when Metro bundler tries to compile the JS

The code signing error is **not the actual problem** - it's a normal part of the fastlane match workflow and occurs in both successful and failing builds.

### Solution

Ensure workspace dependencies are installed before the iOS build begins:

```yaml
# In .github/workflows/testflight-deploy.yml
- name: Install dependencies
  run: npm ci --workspaces
```

**Why this works:**
- `npm ci --workspaces` installs all workspace dependencies defined in `package.json`
- Metro bundler can now resolve `@guidr/shared` during bundle compilation
- JavaScript bundle is generated correctly with source maps

### Prevention

1. **Always use `npm ci --workspaces`** in CI workflows that build any part of the monorepo
2. **Document the reason** - Add a comment explaining the workspace dependency requirement
3. **Don't assume code signing errors** - Check if the build fails *after* the code signing step

---

## Issue: Android Release Build Fails with "Cannot resolve @react-native/metro-config"

### Symptoms

The Android release build fails during `gradlew assembleRelease`:

```
error: Cannot resolve @react-native/metro-config
```

### Root Cause

Metro bundler (used by React Native's Android build) cannot find the `@react-native/metro-config` package because workspace dependencies weren't installed.

### Solution

In `.github/workflows/android-release.yml`, ensure workspace dependencies are installed:

```yaml
- name: Install dependencies
  run: npm ci --workspaces
```

This ensures the `mobile/` workspace has all devDependencies, including `@react-native/metro-config`.

---

## Issue: Docker Build Fails with "npm run web:build: command not found"

### Symptoms

The Docker build fails in the web-builder stage:

```
RUN npm run web:build
# Output: exit code 127 (command not found)
```

### Root Cause

The `web-app/` workspace dependencies aren't installed, so npm scripts are unavailable.

### Solution

In `api-server/Dockerfile`, use `npm ci --workspaces`:

```dockerfile
RUN npm ci --workspaces
```

This installs dependencies for all workspaces, making the `web:build` script available.

---

## Understanding npm Workspace Installation

### The Difference

```bash
# Without --workspaces: Only installs root package dependencies
npm ci

# With --workspaces: Installs dependencies for all workspace packages
npm ci --workspaces
```

### When to Use `--workspaces`

- **In CI workflows** that build any monorepo package (mobile, web, API)
- **In Docker builds** that build or depend on workspace packages
- **When setting up development environment** for the full monorepo

### When NOT to Use

- Only when installing dependencies for a specific package: `npm ci --prefix=mobile`
- In scripts that explicitly install single-package dependencies

---

## Troubleshooting Checklist

When a CI/CD workflow fails:

1. **Check if it involves monorepo packages** (mobile, web-app, shared)
   - If yes, verify `npm ci --workspaces` is being used

2. **Look for the actual error, not the first error**
   - First errors might be red herrings (like code signing)
   - Scroll through logs to find where the build actually fails

3. **For Metro bundler errors** (Metro resolution issues, missing bundles)
   - Almost certainly caused by missing workspace dependencies
   - Verify `npm ci --workspaces` is in the workflow

4. **For code signing errors in TestFlight**
   - Check if the error occurs *before* or *after* the build
   - Errors from fastlane match before the actual xcodebuild are recoverable
   - Real errors happen during xcodebuild and show build failure

5. **Verify npm cache is fresh**
   - GitHub Actions caches npm modules
   - If troubleshooting, consider invalidating the cache

---

## Red Herrings in CI Logs

### Fastlane Match "No Code Signing Identities Found"

```
ERROR: There are no local code signing identities found.
```

**This is expected and usually recoverable!**

- Happens because the temporary keychain doesn't initially have identities
- Fastlane automatically imports the certificates from Gitea
- Build continues successfully

**Only a problem if:**
- It's the LAST error in the logs
- Build fails immediately after this error
- Fastlane doesn't show "Installed Certificate" or "key imported" after

### Sentry Source Map Warnings

```
Sentry Logger [warn]: Source map file not found
```

**Compare with actual errors:**
- `[warn]` = non-fatal warning, build continues
- `[error]` = fatal error, build fails

If you see `[error]: Source map file does not exist`, check workspace dependencies.

---

## Related Documentation

- **Monorepo Structure**: See `CLAUDE.md` for workspace overview
- **Design System**: See `@guidr/shared` in `shared/` package for token/style definitions
- **GitHub Actions**: See `.github/workflows/` for all CI workflows

---

## Contact & Issues

For CI/CD issues:

1. Check this troubleshooting guide first
2. Review the actual build logs (scroll to the bottom for real errors)
3. Look for related issues in the GitHub Projects board
4. Check if workspace dependencies are properly installed

---

**Last Updated**: 2026-02-01
**Related Files**:
- `.github/workflows/android-release.yml`
- `.github/workflows/testflight-deploy.yml`
- `api-server/Dockerfile`
- `CLAUDE.md`
