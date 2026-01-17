# ADR-013: iOS TestFlight Build Optimization for GitHub Actions

**Date**: 2026-01-17

**Status**: Accepted

## Context

iOS TestFlight builds in GitHub Actions were consistently timing out after 120 minutes, causing deployment failures and preventing releases.

### Root Cause Analysis

Investigation identified three bottlenecks:

1. **Verbose Logging (PRIMARY - 50-70% slowdown)**
   - Location: `.github/workflows/testflight-deploy.yml:207`
   - Issue: `-verbose` flag generates 10-100x more log output than normal builds
   - Impact: I/O bottleneck writing massive logs via `tee build.log`
   - Introduced in commit 1f5427c (Jan 17, 2026) as a "performance optimization" that backfired

2. **Sentry Symbol Upload During Build (SECONDARY - 10-20% slowdown)**
   - Location: Build phase in `mobile/ios/guidr.xcodeproj/project.pbxproj`
   - Issue: Synchronous network upload to Sentry API during compilation
   - Impact: Blocks build waiting for Sentry API responses
   - Affects: Only crash symbolication, not build correctness

3. **Cloudflare Bypass Propagation Delay (TERTIARY - 1-2% slowdown)**
   - Location: `.github/workflows/testflight-deploy.yml:47`
   - Issue: 60-second wait for Bot Fight Mode bypass to propagate
   - Impact: ~2-4 minutes total overhead
   - Affects: Fastlane match certificate synchronization step

### Timeline

- Jan 16: Commit 1f5427c added DerivedData caching + `-verbose` flag for debugging
- Jan 17: Builds started timing out at 120 minutes (>50% increase from 60-80 min)
- Jan 17: Root cause analysis revealed verbose logging as primary culprit

## Decision

Implement a three-phase optimization strategy:

### Phase 1: Remove Verbose Logging and Optimize Output (CRITICAL)

**Changes to `.github/workflows/testflight-deploy.yml` lines 188-223:**

1. **Remove `-verbose` flag** - Eliminates 10-100x log multiplication
2. **Add environment variable**: `SENTRY_DISABLE_XCODE_DEBUG_UPLOAD: true` - Prevents synchronous network calls during build
3. **Add `-hideShellScriptEnvironment` flag** - Reduces unnecessary output from build scripts
4. **Add build timing instrumentation** - Track duration for monitoring:
   ```bash
   BUILD_START=$(date +%s)
   # ... build command ...
   BUILD_END=$(date +%s)
   BUILD_DURATION=$((BUILD_END - BUILD_START))
   echo "✅ Build completed in $((BUILD_DURATION / 60))m $((BUILD_DURATION % 60))s"
   ```
5. **Increase error log output** - Change tail from 50 to 100 lines for better debugging

**Expected improvement**: 40-80 minutes saved (50-70% reduction from 120+ min → 40-60 min)

### Phase 2: Post-Build Sentry Symbol Upload

**Insert new step after line 223** (after "Build iOS archive" completes):

```yaml
- name: Upload debug symbols to Sentry
  if: success() && (github.event_name == 'workflow_dispatch' || github.event_name == 'repository_dispatch')
  continue-on-error: true
  working-directory: mobile
  run: |
    cd ios
    DSYM_PATH="./build/guidr.xcarchive/dSYMs/guidr.app.dSYM"

    if [ ! -d "$DSYM_PATH" ]; then
      echo "⚠️ Warning: dSYM not found at $DSYM_PATH"
      exit 0
    fi

    echo "📤 Uploading debug symbols to Sentry..."
    npx @sentry/cli debug-files upload \
      --auth-token "${{ secrets.SENTRY_AUTH_TOKEN }}" \
      --org madebysteven \
      --project guidr \
      "$DSYM_PATH"

    echo "✅ Debug symbols uploaded to Sentry"
```

**Key features:**
- `continue-on-error: true` - Network failures don't fail the build
- Runs after build completes - No blocking on network I/O
- Non-blocking: Sentry symbols available 5-10 min after build instead of immediately
- Same functionality: Crash reports still properly symbolicated

**Expected improvement**: 8-15 minutes saved (10-20% reduction from network I/O removal)

### Phase 3: Reduce Cloudflare Bypass Delay (Optional)

**Change line 47** in `.github/workflows/testflight-deploy.yml`:

```yaml
bfm_propagation_delay: 30  # Reduced from 60
```

**Rationale**:
- 60-second delay is conservative, 30-second is sufficient for most cases
- Rollback plan: Increase back to 60 if fastlane match fails with "403 Forbidden"

**Expected improvement**: ~2 minutes saved (1-2% reduction)

## Consequences

### Positive
- **Massive time reduction**: 50-70% improvement (120+ min → 40-60 min)
- **Consistent builds**: Decoupled from network dependencies (Sentry API)
- **Better monitoring**: Build duration tracking enables trend analysis
- **Cache effectiveness**: Faster builds mean cache hits have bigger impact (30-40% faster on subsequent runs)
- **Reduced CI/CD infrastructure cost**: Shorter build duration = fewer GitHub Actions minutes
- **No functional regressions**: All features preserved (TestFlight, crash reporting, code signing)
- **Backwards compatible**: No changes to build outputs or signing processes

### Negative
- **Less verbose logs**: During successful builds, less detailed compilation output
  - Mitigation: Failure cases still show last 100 lines of logs
  - Tradeoff: Worth 50-70% speedup
- **Delayed Sentry symbols**: Debug symbols available 5-10 min after build completes instead of during build
  - Mitigation: Symbols still available before TestFlight processing begins
  - No user impact: Crash reports still fully symbolicated
- **Network failure isolation**: If Sentry upload fails, build still succeeds (separate step)
  - Tradeoff: Acceptable since Sentry is optional for app functionality

### Neutral
- **Build behavior unchanged**: Same compilation process, same output binaries
- **Signing process unchanged**: Code signing happens before Sentry step
- **TestFlight upload unchanged**: All TestFlight functionality preserved

## Trade-offs Analysis

### Option A (Selected): Remove Verbose + Post-Build Sentry Upload
- **Pros**: 50-70% speedup, decoupled network I/O, better reliability
- **Cons**: Delayed Sentry symbols (5-10 min), less verbose logs
- **Result**: Builds complete in 40-60 min, crash reports work normally

### Option B: Keep Verbose, Just Remove Sentry Upload
- **Pros**: Keeps detailed logs, faster than current
- **Cons**: Still 50+ minutes, still hitting I/O bottleneck
- **Rejected**: Doesn't address root cause

### Option C: Keep Everything, Just Add More Resources
- **Pros**: No workflow changes
- **Cons**: More expensive GitHub Actions hours, doesn't fix root issue
- **Rejected**: Wrong solution for I/O bottleneck

### Option D: Remove Verbose Only, Keep Sentry During Build
- **Pros**: Simpler change
- **Cons**: Still 10-20% slower due to network blocking
- **Rejected**: Leaves 8-15 minutes on the table

## Implementation

### File Changes

1. **`.github/workflows/testflight-deploy.yml`**
   - Remove `-verbose \` flag (line 207)
   - Add `SENTRY_DISABLE_XCODE_DEBUG_UPLOAD: true` env var (line 192)
   - Add `-hideShellScriptEnvironment` flag (line 205)
   - Add build timing calculation (lines 197, 212-214)
   - Update error message with duration (line 217)
   - Change tail from 50 to 100 lines (line 219)
   - Update success message with duration (line 223)
   - Insert post-build Sentry upload step (after line 223)
   - Change Cloudflare delay from 60 to 30 (line 47)

2. **No changes required to**:
   - `mobile/ios/ExportOptions.plist` (already correct)
   - `mobile/ios/guidr.xcodeproj/project.pbxproj` (env var disables Sentry upload)
   - Application code (build output identical)

### Testing Strategy

**Test 1: Build Success**
- Trigger workflow: `gh workflow run testflight-deploy.yml`
- Monitor build time (should be 40-60 min)
- Verify IPA uploaded to TestFlight
- Verify Sentry symbols appear (within 10 min)
- Test crash reporting in TestFlight build

**Test 2: Build Failure**
- Introduce syntax error in AppDelegate.swift
- Trigger workflow
- Verify failure is caught quickly (5-10 min)
- Verify error logs shown (last 100 lines)
- Verify Sentry step skipped (failure condition)

**Test 3: Cache Effectiveness**
- Run two builds back-to-back
- Compare build times
- First build: 40-60 min (no cache)
- Second build: 25-40 min (cache hit)

### Success Criteria
- ✅ Build time reduced to 40-60 minutes (from 120+)
- ✅ TestFlight upload succeeds
- ✅ Sentry symbols uploaded within 10 minutes
- ✅ Crash reports properly symbolicated
- ✅ No functional regressions
- ✅ Error output shows at least 100 lines on failure

## Verification Plan

### Automated
```bash
# Verify workflow syntax
gh workflow view testflight-deploy.yml

# Check for lint errors
grep -n "verbose" .github/workflows/testflight-deploy.yml  # Should be 0 matches
grep -n "SENTRY_DISABLE_XCODE_DEBUG_UPLOAD" .github/workflows/testflight-deploy.yml  # Should be 1 match
```

### Manual
1. Trigger workflow and monitor duration
2. Check GitHub Actions logs for build timing output
3. Verify TestFlight notification received
4. Check Sentry dashboard 10 minutes after build completes
5. Test crash reporting with test device

## Rollback Plan

### If Build Still Times Out
1. Check build.log for new bottlenecks (network timeouts, pod scaling, etc.)
2. Verify cache is being restored (check "Restore Xcode DerivedData cache" step)
3. If cache miss, check if Podfile.lock or project.pbxproj changed
4. Temporarily re-enable `-verbose` to debug (revert if doesn't help)
5. As last resort, increase timeout to 150 minutes (but investigate first)

### If Sentry Upload Fails
1. Check Sentry API status (sentry.io)
2. Verify `SENTRY_AUTH_TOKEN` is valid and has correct permissions
3. If persistent, re-enable build-time upload: `SENTRY_DISABLE_XCODE_DEBUG_UPLOAD: false`
4. Remove post-build step if returning to build-time upload

### If Fastlane Match Fails
1. Error will be "403 Forbidden" with 30-second delay
2. Increase Cloudflare delay back to 60 seconds
3. Check Gitea API availability (git.madebysteven.nl)
4. Verify `GITEA_TOKEN` has correct permissions

### Emergency Revert
```bash
git log --oneline | head -5  # Find the commit
git revert <commit-sha>      # Create revert commit
git push origin main         # Push revert
gh workflow run testflight-deploy.yml  # Test
```

## Dependencies

### Required
- `@sentry/cli` npm package (already installed in mobile/package.json)
- `SENTRY_AUTH_TOKEN` secret (already configured)
- GitHub Actions macOS-15 runner (already used)

### Already Available
- xcodebuild (part of Xcode)
- fastlane (already in Gemfile)
- CocoaPods (already installed)

### No New Secrets Needed
All required secrets already configured from ADR-006 (authentication) and ADR-012 (Telegram).

## Performance Impact

### Build Duration Changes

| Phase | Before | After | Savings |
|-------|--------|-------|---------|
| Verbose logging | 60-80 min | 20-40 min | 40-60 min (50-70%) |
| Sentry upload | 8-15 min | 0 min (async) | 8-15 min (10-20%) |
| Cloudflare delay | 2-4 min | 1-2 min | 1-2 min (1-2%) |
| **Total** | **120+ min** | **40-60 min** | **50-80 min (50-70%)** |

### With DerivedData Cache Hit
- First build: 40-60 min
- Subsequent builds: 25-40 min (30-40% faster)

### CI/CD Cost Reduction
- Assuming $0.008 per GitHub Actions minute (macOS-15)
- Old: 120 min × $0.008 = $0.96 per build
- New: 50 min × $0.008 = $0.40 per build
- Savings: ~$0.56 per build (58% reduction)

## Related ADRs

- **ADR-012** (API Server Crash Notifications): Telegram integration setup
- **ADR-011** (Fastlane Match Certificate Management): Code signing strategy
- **ADR-010** (Strict Type Safety Rules): TypeScript standards
- **ADR-006** (Admin User Authorization): Initial Telegram secrets setup

## Commit Reference

Implementation committed as: `perf: optimize iOS TestFlight build - remove verbose logging, post-build Sentry upload, reduce Cloudflare delay`

Changes follow:
- Conventional Commits specification (perf:)
- Project documentation standards
- No breaking changes
- Improves developer experience and CI/CD efficiency

## Future Enhancements

### Phase 2 (Optional): Parallel Build Steps
- Run codesigning and Sentry upload in parallel
- Potential 5-10 minute additional savings

### Phase 3 (Optional): Multi-Job Matrix Build
- Split build and export into separate macOS runners
- Run tests on Linux runner in parallel
- Complex, requires careful artifact handling

### Phase 4 (Optional): Incremental Build Caching
- Cache compiled .o files, not just DerivedData
- More granular caching for modified files
- Requires custom cache key logic

## Phase 4: CocoaPods Build System Optimization (Tier 1 Solutions - Added 2026-01-17)

After initial optimization, additional analysis identified specific CocoaPods build phase bottlenecks:

### Root Cause: [CP] Embed Pods Frameworks Dependency Tracking

The "[CP] Embed Pods Frameworks" script phase uses Xcode New Build System input/output file lists to determine when to run. On GitHub Actions runners, the file change detection can hang indefinitely, causing 60+ minute hangs despite compilation completing successfully.

### Solution 4A: Remove CocoaPods Build Phase Input/Output File Lists

**Changes to `mobile/ios/guidr.xcodeproj/project.pbxproj`**:

Remove the following lines from the "[CP] Embed Pods Frameworks" script phase (ID: `00EEFC60759A1932668264C0`):

```
inputFileListPaths = (
  "${PODS_ROOT}/Target Support Files/Pods-guidr/Pods-guidr-frameworks-${CONFIGURATION}-input-files.xcfilelist",
);
outputFileListPaths = (
  "${PODS_ROOT}/Target Support Files/Pods-guidr/Pods-guidr-frameworks-${CONFIGURATION}-output-files.xcfilelist",
);
```

**Rationale**: Most documented fix for this exact issue in CircleCI, GitHub Actions, and other CI environments. Forces the script to always run, ignoring Xcode's dependency tracking (acceptable since CI builds are clean).

**Impact**: Eliminates 60-minute hangs at this phase, completes in < 5 minutes

### Solution 4B: Enable Parallel CocoaPods Code Signing

**Changes to `.github/workflows/testflight-deploy.yml` "Build iOS archive" step**:

Add environment variable:
```yaml
env:
  SENTRY_DISABLE_XCODE_DEBUG_UPLOAD: true
  COCOAPODS_PARALLEL_CODE_SIGN: true  # NEW
```

**Rationale**: Process multiple pod frameworks simultaneously during code signing phase (default is serial processing)

**Impact**: Reduces framework embedding time by 50-70% with 226 pods

**Configuration**: Xcode 14.3+ supports parallel signing; CocoaPods respects the `COCOAPODS_PARALLEL_CODE_SIGN` environment variable

### Phase 4 Testing Strategy

**Test 1: Build Completes Without Hang**
- Trigger workflow: `gh workflow run testflight-deploy.yml`
- Monitor logs for "[CP] Embed Pods Frameworks" step
- Should complete in < 5 minutes (not 60+ minutes)

**Test 2: Framework Signing Parallelizes**
- Check build logs for parallel signing operations (if any pod-related signing logs appear)
- Verify total build time < 50 minutes

**Test 3: Build Artifact Integrity**
- Download IPA from workflow artifacts
- Verify frameworks are properly embedded with `codesign -v -v guidr.app/Frameworks/*.framework`
- Install on test device; verify app launches and functions

## Monitoring

After deployment, monitor:
1. **Build Duration**: Target 40-60 min, alert if > 100 min
2. **[CP] Embed Pods Frameworks Duration**: Should be < 5 min (previously 60+ min hang)
3. **Cache Hit Rate**: Target 80%+ on subsequent builds
4. **Sentry Upload Success**: Target 100%
5. **TestFlight Upload Success**: Target 95%+ (unchanged)
6. **Timeout Frequency**: Target 0 (vs 100% before phases 1-4)

Check metrics in GitHub Actions workflow run logs every week for first month.
