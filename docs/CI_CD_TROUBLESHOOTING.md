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

The Android release build fails during the Hermes bundling task:

```
Error: Cannot resolve `@react-native/metro-config`. Ensure it is listed in your project's `devDependencies`.
    at loadMetroConfig (/node_modules/@react-native/community-cli-plugin/dist/utils/loadMetroConfig.js:62:11)
    at Object.buildBundle [as func] (/node_modules/@react-native/community-cli-plugin/dist/commands/bundle/buildBundle.js:22:53)

> Task :app:createBundleReleaseJsAndAssets FAILED
> Process 'command 'node'' finished with non-zero exit value 1
```

This happens during the `createBundleReleaseJsAndAssets` gradle task when React Native tries to bundle JavaScript using Metro.

### Root Cause

Metro bundler cannot find `@react-native/metro-config` because workspace dependencies weren't installed. Same root cause as the TestFlight "missing source map" failure - both are Metro bundler resolution problems when `npm ci` runs without the `--workspaces` flag.

### Solution

In `.github/workflows/android-release.yml`, ensure workspace dependencies are installed:

```yaml
- name: Install dependencies
  run: npm ci --workspaces
```

**Critical:** The `package-lock.json` must have workspace configuration from running `npm install --workspaces` locally. Without it, CI's `npm ci --workspaces` won't work correctly.

This ensures:
1. Root `package.json` workspace configuration is read
2. `mobile/` workspace dependencies installed (including `@react-native/metro-config`)
3. Metro bundler can find all required packages during the build

---

## Issue: Docker Build Fails with "npm run web:build: command not found" or Missing Native Module

### Symptoms

The Docker build fails in the web-builder stage with one of two errors:

**Error 1: Command not found (exit code 127)**
```
RUN npm run web:build
# Output: exit code 127 (command not found)
```

**Error 2: Missing native module (especially on ARM64)**
```
Error: Cannot find module @rollup/rollup-linux-arm64-gnu
npm has a bug related to optional dependencies (https://github.com/npm/cli/issues/4828)
```

### Root Cause

- **Error 1:** The `web-app/` workspace dependencies aren't installed, so npm scripts are unavailable
- **Error 2:** `npm ci` skips optional dependencies in some scenarios, particularly for architecture-specific native modules (like Rollup's ARM64 binary). Docker needs to install dependencies for the **current build architecture**, not just the lock file's architecture.

### Solution

In `api-server/Dockerfile`, use `npm install --workspaces` (not `npm ci`):

```dockerfile
RUN npm install --workspaces
```

**Why `npm install` instead of `npm ci`:**
- Docker is a clean environment (no reproducibility concerns)
- `npm install` properly handles optional dependencies for the current architecture
- `npm ci` is optimized for CI reproducibility but can skip optional deps
- Multi-architecture builds (linux/amd64, linux/arm64) need architecture-specific natives

This installs:
1. Dependencies for all workspaces (`@guidr/shared`, `mobile`, `web-app`)
2. Optional dependencies like native Rollup modules for the current architecture
3. Makes the `web:build` script available

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
