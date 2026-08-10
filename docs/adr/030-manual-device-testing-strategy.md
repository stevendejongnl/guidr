# ADR-030: Manual Device Testing Strategy for Android-Native Behavior

**Status:** Accepted
**Date:** 2026-08-10
**Authors:** Steven de Jong, Claude

## Context

While fixing a string of notification bugs (permission request timing, critical-channel audio routing, changelog rendering — see the PRs referenced below), it became clear there is no automated verification of Android-native runtime behavior anywhere in this project:

- `npm run mobile:test` (Jest, 1500+ tests) runs entirely in Node. Every React Native native module is mocked (`mobile/__mocks__/react-native.js`), including `NotificationModule`. These tests never execute a single line of Kotlin and cannot catch bugs in native code, OS permission flows, notification channel configuration, or audio-stream routing.
- The "Android Build" CI job (`gradlew assembleDebug`) is compile-only. It catches Kotlin syntax/type errors but never launches the app or runs any code.
- There are no instrumented (Espresso/UI Automator) tests and no emulator step in CI.

Concretely, this gap is what let three real bugs ship undetected through Jest + compile checks:
1. A notification-permission request that only fired on cold start, never on a live login (only found by testing an actual fresh install → sign-in flow).
2. A critical-priority notification channel that was silently muted by the phone's ringer being set to Vibrate (Jest mocks can't observe Android's audio-stream behavior at all).
3. A changelog display clipped to a fixed pixel height that only became obviously wrong once real release-note content was rendered on a real screen.

None of these are things a mocked, Node-based test suite could ever have caught — they required a real device.

## Decision

Until/unless automated instrumented testing is built out (see Alternatives), Android-native behavior is verified by manual testing on two reference physical devices, chosen to bracket the OS/API range this app supports:

| Device | Android version | API level | Role |
|---|---|---|---|
| Google Pixel 10 Pro | Android 16 | 36 | Primary device. Matches `compileSdk`/`targetSdk = 36` exactly — this is what most users are assumed to be closest to on a modern device. |
| Lenovo Tab M10 Plus (3rd Gen) | Android 13 (user-reported, not independently verified) | 33 (assumed) | Older-API / tablet coverage. Android 13 (API 33) is specifically significant because it's when `POST_NOTIFICATIONS` became a runtime-requestable permission — the exact permission flow this ADR's motivating bugs were about. |

Both devices are personally owned by the maintainer, not CI infrastructure. Testing is manual and ad hoc: after a PR touching native code, notification behavior, or permission flows lands, install the built APK on one or both devices and exercise the relevant flow before considering the change verified.

`minSdkVersion = 24` (Android 7.0) is the floor `mobile/android/build.gradle` declares, but is not represented by either reference device — changes that could plausibly break on very old API levels should be reasoned about manually, not assumed covered by this testing strategy.

## Consequences

### Positive
- Real coverage of exactly the class of bug that mocked unit tests structurally cannot catch (permission dialogs, notification channel/audio behavior, on-screen rendering).
- Zero infrastructure cost — no CI emulator time, no instrumented test suite to write and maintain.
- Two devices at opposite ends of the supported API range (33 and 36) gives at least some confidence changes work across OS versions, not just the newest one.

### Negative
- Entirely manual and human-driven — no regression protection. A fix verified today can silently break again in a later change with nothing catching it until the next manual test pass.
- Not reproducible/shareable — results live in a person's head (or a chat transcript), not in CI history or a test report.
- Coverage is opportunistic (whatever the maintainer happens to test), not systematic (no defined test plan/checklist executed every release).
- Two devices, both on the newer/high end of Android versions relatively speaking (API 33 and 36) — no coverage of the API 24–32 range that `minSdkVersion` claims to support.

## Alternatives considered

**Automated instrumented testing in CI** (`reactivecircus/android-emulator-runner` + an Espresso/UI Automator suite) was considered and explicitly not chosen for now. It would catch this class of bug automatically and repeatably, but:
- No instrumented test suite exists today — this would mean writing one from scratch, not wiring up existing tests.
- Emulators can't always exercise real hardware-adjacent behavior faithfully (audio routing and ringer-mode interaction, in particular, is one of the harder things to trust in an emulator vs. a real device).
- Real cost (CI minutes, maintenance) for a small team/single-maintainer project.

This may be revisited if native-code bugs keep recurring at a rate manual testing can't keep up with.

## References

- Related PRs: notification permission timing, critical-channel audio routing (`AudioAttributes.USAGE_ALARM`), `UpdateAvailableScreen` changelog clipping fix
- Related ADRs: none directly; conceptually adjacent to [ADR-029](./029-remove-ios-platform-support.md) in that both are about the shape of platform-specific verification now that iOS is gone and Android is the only native mobile target
