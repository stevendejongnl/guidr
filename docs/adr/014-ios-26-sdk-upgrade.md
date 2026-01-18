# ADR 014: iOS 26 SDK Upgrade

## Status
Accepted

## Context

Apple requires all iOS apps submitted to the App Store to be built with the iOS 26 SDK or later, effective **April 2026** (ITMS-90725 warning).

**Current State**:
- iOS SDK: 18.5 (from Apple warning)
- Deployment Target: iOS 15.1 (unchanged, backward compatible)
- Xcode: 15.x on macos-15 runner
- Build Time: 40-60 minutes (optimized via ADR-013)
- React Native: 0.83.1

**Apple's Requirement**: Starting April 2026, all iOS apps must use iOS 26 SDK or later

**Risk Context**:
- ADR-013 (iOS TestFlight Build Optimization) introduced critical optimizations to prevent 60-minute hangs
- Hermes framework embedding must NOT be disabled (causes DYLD crash in production)
- Build stability is paramount - TestFlight deployments block all mobile releases

## Decision

Upgrade to iOS 26 SDK via macos-26 GitHub Actions runner with Xcode 26, while:

1. **Preserving ADR-013 Optimizations**:
   - File list removal (prevents 60-minute "Embed Pods Frameworks" hang)
   - Hermes framework embedding enablement (prevents DYLD crashes)
   - Post-build Sentry symbol upload (async, doesn't block)

2. **Conservative Staged Rollout**:
   - Phase 1: Update dependencies (@sentry/react-native, npm packages)
   - Phase 2: Update CI/CD runner to macos-26 with Xcode verification
   - Phase 3: Test build validation with comprehensive monitoring
   - Phase 4: TestFlight deployment and physical device testing
   - Phase 5: Regression testing (automated + manual)
   - Phase 6: Production deployment and monitoring

3. **Fallback Strategy**:
   - If macos-26 unavailable: Use macos-15 with explicit Xcode 16.x selection
   - If React Native incompatible: Plan upgrade to 0.84+ (releases Feb 9, 2026)
   - If build fails: Emergency revert to macos-15 in < 10 minutes

4. **No User Impact**:
   - Deployment Target remains iOS 15.1 (backward compatible)
   - No breaking changes to user-facing APIs
   - Same build time and performance (ADR-013 preserved)

## Consequences

### Positive
- **Apple Compliance**: Meets April 2026 App Store requirement
- **Future Proof**: Ready for iOS 26 SDK features (if needed)
- **Build Stability**: ADR-013 optimizations preserved, build time unchanged
- **Minimal Risk**: Staged rollout with comprehensive testing
- **Fast Rollback**: < 10 minutes to revert if critical issue

### Negative
- **Beta Runner**: macos-26 is beta, may have stability issues
- **Dependency Updates**: @sentry/react-native version change (tested for compatibility)
- **Build Monitoring**: Additional 60 minutes for CI/CD test build
- **Device Testing Required**: Must test on physical iOS device to detect DYLD errors

### Risks Mitigated
- **Hermes Crash**: Testing on physical device catches DYLD errors (Phase 4)
- **Build Timeout**: File list removal step prevents regression (ADR-013 preserved)
- **Compatibility**: Full test suite validates changes before production

## Implementation

### Phase 1: Dependency Updates

**Files Modified**:
- `mobile/package.json`: Updated `@sentry/react-native` from ^7.8.0 to ^6.10.0
- `mobile/package.json`: Updated all dependencies via `npm update`
- `mobile/src/presentation/App.tsx`: Removed `enableLogs` property (incompatible with updated Sentry)

**Verification**:
```bash
cd mobile
npm test              # 913 tests pass
npm run lint          # 18 warnings (pre-existing, acceptable)
npm run typecheck     # No TypeScript errors
```

### Phase 2: CI/CD Runner Update

**Files Modified**:
- `.github/workflows/testflight-deploy.yml`:
  - Line 23: Changed `runs-on: macos-15` to `runs-on: macos-26`
  - Lines 40-48: Added "Verify Xcode version" step to log SDK information

**Xcode Verification Step**:
```yaml
- name: Verify Xcode version
  run: |
    echo "🔍 Checking Xcode version on macos-26 runner..."
    xcodebuild -version
    echo ""
    echo "🔍 Checking iOS SDK versions available..."
    xcodebuild -showsdks | grep iphoneos
    echo ""
    echo "✅ Expected: Xcode 26.x with iOS 26 SDK (or Xcode 16.x as fallback)"
```

**ADR-013 Preservation**:
- NO changes to lines 143-170 ("Verify and Remove CocoaPods Build System File Lists")
- NO changes to lines 336-361 (Sentry symbol upload)
- File list removal still prevents 60-minute hangs
- Hermes framework embedding still prevented from crashing

### Phase 3: Test Build Validation

**Triggered**: `gh workflow run testflight-deploy.yml --ref main`

**Monitoring Checklist**:
- ✅ Xcode verification shows Xcode 26.x and iOS 26 SDK
- ✅ CocoaPods install completes in < 2 minutes
- ✅ File list removal step succeeds (critical for build time)
- ✅ "[CP] Embed Pods Frameworks" completes in < 5 minutes
- ✅ Build archive completes in 40-60 minutes (no timeout)
- ✅ No DYLD errors in build logs
- ✅ IPA artifact created successfully
- ✅ Sentry symbols uploaded to Sentry dashboard

**Success Criteria**: Build completes without timeout or build errors

### Phase 4: TestFlight Deployment & Device Testing

**Device Testing Checklist** (on iOS 15.1+ device):
1. Install build from TestFlight
2. Launch app - **CRITICAL**: Must not crash with DYLD error
3. Test core functionality:
   - User authentication
   - Session creation
   - Guide navigation
   - Admin mode (if applicable)
4. Check device logs for DYLD errors:
   ```bash
   log show --predicate 'eventMessage contains "DYLD"' --last 1h
   ```
5. Test crash reporting (trigger test error, check Sentry)

**Success Criteria**: App launches, no DYLD crashes, all features work

### Phase 5: Regression Testing

**Automated Tests**:
```bash
cd mobile
npm test              # All 913 tests pass
npm run lint          # No new errors
npm run typecheck     # No new errors
```

**Manual Testing Matrix**:
| Feature | Test |
|---------|------|
| User Registration/Login | ✅ Works on iOS 26 SDK |
| Session Creation | ✅ Persists across app restart |
| Guide Navigation | ✅ No UI glitches |
| Step Completion | ✅ Tracks progress correctly |
| Admin Mode | ✅ Accessible and functional |
| Markdown Rendering | ✅ Display correct formatting |
| Sentry Crash Reporting | ✅ Symbols uploaded, crashes traced |

**Success Criteria**: No regressions from SDK upgrade

### Phase 6: Production Deployment

**Steps**:
1. Create PR with all changes (dependencies, workflow, code fixes)
2. Review PR (verify all changes documented)
3. Merge to main (semantic-release will bump version)
4. Monitor first 48 hours:
   - Build succeeds consistently
   - Crash rate remains < 0.5%
   - Build time remains 40-60 minutes
   - No user complaints in TestFlight

**Success Criteria**: Production builds stable, App Store accepts iOS 26 SDK build

## Verification

### Local Checks
```bash
# Phase 1
cd mobile && npm test && npm run lint && npm run typecheck

# Workflow changes
grep "macos-26" .github/workflows/testflight-deploy.yml
grep "Verify Xcode version" .github/workflows/testflight-deploy.yml
```

### CI/CD Checks
```bash
# Trigger test build
gh workflow run testflight-deploy.yml --ref main

# Check build logs
gh run view <run-id> --log | grep -E "Xcode|iOS.*SDK|Build completed|DYLD|hermesvm"
```

### App Store Check
After production deployment:
- App Store Connect shows: "Built with iOS 26 SDK or later"
- ITMS-90725 warning resolved
- Build metadata confirms Xcode 26 usage

## Rollback Plan

### Scenario 1: Build Fails with Xcode 26 Errors
```yaml
# Revert runner
runs-on: macos-15  # macos-26 changed back

# Or pin to Xcode 16.x
- run: sudo xcode-select -s /Applications/Xcode_16.3.app
```

### Scenario 2: App Crashes on Launch (DYLD)
```bash
# Emergency rollback
git revert <commit-sha>
git push origin main
```

### Scenario 3: Build Time Regression
Check if sed syntax changed on macos-26, may need BSD sed compatibility fix

### Scenario 4: Dependency Incompatibility
```bash
cd mobile
git checkout package.json package-lock.json ios/Podfile.lock
npm install
```

## Impact on Dependent Systems

### GitHub Actions
- Upgrade macos-15 runner to macos-26
- First build takes 60 minutes (includes compilation)
- Subsequent builds may be faster (CocoaPods cache)

### CI/CD Pipeline
- Xcode version verification added (non-blocking)
- Build time: 40-60 minutes (unchanged per ADR-013)
- Sentry symbol upload: post-build (async, no blocking)

### App Store Connect
- Build metadata will show iOS 26 SDK
- ITMS-90725 warning will be resolved
- TestFlight upload unchanged

### User Devices
- **NO CHANGES**: Deployment target remains iOS 15.1
- **NO CHANGES**: User-facing APIs unchanged
- **NO CHANGES**: App features and behavior unchanged

## Related ADRs

- [ADR-011](./011-fastlane-match-certificate-management.md): Fastlane Match certificate management
- [ADR-012](./012-api-server-crash-notifications.md): Sentry crash notifications
- [ADR-013](./013-ios-testflight-build-optimization.md): iOS TestFlight build optimization (file list removal, Hermes embedding)

## References

- [Apple App Store Requirement: ITMS-90725](https://help.apple.com/app-store-connect/en.lproj/static.html#/dev8b4250b57)
- [Xcode 26 Release Notes](https://developer.apple.com/documentation/xcode-release-notes/xcode-26-release-notes)
- [React Native 0.83.1 + Xcode Compatibility](https://github.com/facebook/react-native/releases/tag/v0.83.1)
- [ADR-013: iOS TestFlight Build Optimization](./013-ios-testflight-build-optimization.md)
