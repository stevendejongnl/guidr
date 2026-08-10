# ADR-029: Remove iOS Platform Support

**Status:** Accepted
**Date:** 2026-08-10
**Authors:** Steven de Jong, Claude

## Context

Guidr shipped a full parallel iOS stack alongside Android: a native Xcode project, a Live Activity + home-screen widget extension, fastlane/TestFlight CI pipelines, and certificate management via fastlane match. The team has stopped developing for iOS — Guidr now targets Android and Web only. Maintaining the iOS stack meant:

- Paying for `macos-26` GitHub Actions runners on every PR and release (widget tests + simulator build)
- Recurring fastlane match certificate renewals and Apple Developer Portal maintenance
- Native Swift code (`LiveActivityModule`, `DiagnosticLogModule`) and its JS bridge that only ever ran on iOS, sitting unused and untested on the Android-only build
- Two sets of platform-specific instructions across CLAUDE.md, README, and Claude skills, only one of which was still accurate

None of this was exercised or verified once iOS development stopped, so it was dead weight rather than a maintained platform.

## Decision

Remove the iOS platform end-to-end in a single PR:

- **CI/CD**: Deleted `ios-widget-tests.yml`, `initialize-ios.yml`, `renew-ios-certificates.yml`, `testflight-deploy.yml`. Removed the `ios-widget-tests`/`ios-build` jobs from `ci-cd.yml` and the "Wait for iOS Widget Tests" release gate from `release.yml`. Removed the iOS/fastlane entries from `dependabot.yml`.
- **Native project & build tooling**: Deleted `mobile/ios/` (Xcode project, Podfile, fastlane, widget extension, widget tests, entitlements), `mobile/Gemfile(.lock)`, and the iOS-only build scripts. Stripped the iOS branches out of the shared scripts that also serve Android (`copy-config.js`, `generate-icons.js`, `sync-version.sh`, `setup-sentry-symlink.js`). Removed the `ios`/`ios:build`/`preios`/`mobile:ios` npm scripts and the iOS asset reference in `.releaserc.json`. Fixed `.husky/pre-commit` and `.husky/pre-push`, which still invoked `xcodebuild` against the now-deleted `mobile/ios` directory.
- **App code**: Deleted `LiveActivityService`, `DiagnosticLogService`, and the `useLiveActivity` hook — all three were iOS-only native bridges that no-opped on Android. Removed the now-unreachable "Live Activity Diagnostics" panel from `AdminScreen`. Removed every `Platform.OS === 'ios'` branch (`NotificationService`, `NotificationPreferencesStorage`, `ConfigLoader`, `AppOutdatedScreen`, `KeyboardAvoidingView` behavior in `ServerSetupScreen`/`LoginScreen`), keeping only the Android-only behavior. Flipped the default `Platform.OS` in the Jest RN mock to `'android'`.
- **Docs**: Updated CLAUDE.md, README.md, CONTRIBUTING.md, DEPLOYMENT_QUICK_START.md, `docs/SEMANTIC_RELEASE_SETUP.md`, `api-server/README.md`, and the `build`/`monorepo-commands` Claude skills to drop iOS commands and instructions. Removed the false "iOS App" / "iOS + Android" marketing claims from the public web-app landing page.

**Explicitly out of scope / kept as-is**: the six iOS-era ADRs (ADR-011, ADR-013, ADR-014, ADR-016, ADR-024, ADR-025) and the linked debugging runbooks (`docs/ios-certificate-cleanup.md`, `docs/debugging/widget-live-activity-history.md`, `docs/debugging/live-activity-invisible.md`) are left untouched as the historical record of decisions made while iOS was supported. They are not superseded — they document real work that shipped and ran in production; they're just no longer applicable to the current platform target.

## Consequences

### Positive

- No more `macos-26` CI runners on every PR/release — faster, cheaper CI
- No more fastlane match certificate renewal or Apple Developer Portal maintenance
- No dead native code paths (`LiveActivityService`/`DiagnosticLogService` always no-op'd on Android)
- Single source of truth for build/deploy instructions (Android only)
- Local `pre-commit`/`pre-push` hooks no longer fail on machines with Xcode installed

### Negative

- Losing the iOS distribution channel (TestFlight) — any existing iOS users lose the ability to receive updates
- The Live Activity / home-screen widget features (ADR-024, ADR-025) are gone entirely, not just paused
- Re-adding iOS support later would mean rebuilding the native project from scratch rather than un-deleting it, since `mobile/ios/` is removed rather than archived

## Manual follow-ups (outside this repo / not achievable via a PR)

- Delete the iOS-only GitHub repo secrets: `APPLE_ID`, `APPLE_TEAM_ID`, `APP_STORE_CONNECT_API_KEY_CONTENT`, `APP_STORE_CONNECT_API_KEY_ID`, `APP_STORE_CONNECT_ISSUER_ID`, `MATCH_PASSWORD`
- Check GitHub branch protection rules for a required "iOS Widget Tests" or "iOS Build" status check — if present, it will block merges forever since that check can no longer report
- Rotate the Sentry auth token that was committed in plaintext in the now-deleted `mobile/ios/sentry.properties`
- Archive or delete the external fastlane match certificate repo (`guidr-certificates`), which lives outside this monorepo

## References

- **Related ADRs (kept, not superseded):** ADR-011, ADR-013, ADR-014, ADR-016, ADR-024, ADR-025
