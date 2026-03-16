# ADR-024: iOS Live Activity for Timer Countdown

## Status

Accepted

## Context

When a user has a countdown timer running on a step in Guidr, they must open the app to see progress. iOS Live Activities (iOS 16.1+) allow showing a real-time countdown on the lock screen and Dynamic Island, letting users track their timer without switching back to the app.

We evaluated two approaches:
1. **Third-party library** (`@kingstinct/react-native-activity-kit`) — wraps ActivityKit but still requires hand-writing the SwiftUI widget views
2. **Custom native module** — directly bridge 3 methods (start, update, end) following the existing `ApkInstallerModule` pattern

## Decision

We chose the custom native module approach because:

- The SwiftUI widget views must be written by hand regardless of approach
- Only 3 native calls are needed: `startActivity`, `updateActivity`, `endActivity`
- Avoids adding a Nitro Modules build dependency
- Follows the existing `ApkInstallerModule` bridge pattern already in the codebase
- `Text(timerInterval:countsDown:)` in SwiftUI provides OS-native countdown accuracy without JS thread involvement

### iOS Deployment Target: 15.1 → 16.1

Live Activities require iOS 16.1+. The `@available(iOS 16.1, *)` guard ensures the native module gracefully no-ops on older versions. iOS 16+ covers ~97% of active devices.

### Architecture

- **Widget Extension** (`GuidrTimerWidget`): SwiftUI views for lock screen and Dynamic Island
- **Native Module** (`LiveActivityModule`): Swift/Obj-C bridge exposing ActivityKit to React Native
- **TypeScript Service** (`LiveActivityService`): Platform-gated wrapper with silent error handling
- **React Hook** (`useLiveActivity`): Lifecycle management with cleanup on unmount
- **Integration**: Wraps existing `onStart`/`onPause`/`onReset` callbacks in `GuideDetailScreen`

### Scope

- Single active Live Activity at a time (new timer replaces existing)
- Countdown mode only (steps with `duration > 0`)
- Progress bar colors match existing CountdownTimer pattern: green (>50%), yellow (25-50%), red (<25%)
- **Dynamic Island: not supported.** The widget code includes a `dynamicIsland:` view (required by ActivityKit's API — all `ActivityConfiguration` closures must provide one), but it is not tested or validated on Dynamic Island devices (iPhone 14 Pro+). Tested only on iPhone 13 and earlier, where Live Activities appear as a lock screen banner and in the notification center.

## Consequences

### Positive
- Users can track countdown timers from the lock screen and Dynamic Island
- No third-party dependency added
- Non-critical feature: all Live Activity calls silently fail on error or unsupported devices
- Existing timer functionality is unchanged

### Negative
- iOS deployment target bumped from 15.1 to 16.1 (drops support for iOS 15 devices)
- Widget extension requires separate App ID and provisioning profile in Apple Developer Portal
- `project.pbxproj` changes require Xcode for adding the widget target
- Live Activities don't work in the iOS Simulator (physical device required for testing)
- Progress bar only updates on meaningful events (pause/resume/step change), not every second

## Known Issues & Fixes

### Timer Display Freezes After ~15 Minutes (Fixed)

**Symptom**: Live Activity countdown stopped updating visually after ~10–15 minutes when app was backgrounded. Logs showed `state=stale` cycling with `state=active`.

**Root cause**: iOS enforces a budget of ~15 Live Activity updates per hour for backgrounded apps. The original implementation called `activity.update()` every second via a `DispatchSourceTimer`, exhausting the budget in ~15 minutes, after which iOS throttled further updates.

Additionally, passing `staleDate: soonestRunningEndDate()` on every update told iOS "this content expires at the timer's end", which may have contributed to reduced update priority.

**Fix** (commit: see git history):
1. `TimerText` in `GuidrTimerWidgetLiveActivity.swift` now uses `Text(endDate, style: .timer)` — an OS-native countdown that renders system-side without requiring app updates.
2. The `tickCountdown()` dispatch timer no longer calls `activity.update()`. It still ticks every second to keep `timerEntries.remainingSeconds` current for in-app display.
3. All `activity.update()` calls now pass `staleDate: nil` to prevent iOS from pre-emptively marking content stale.

**Why `Text(timerInterval:countsDown:)` was not used**: This API crashes the widget extension in Live Activity contexts (first discovered in commits 13fa1ca / be76e78, March 2026). `Text(_:style: .timer)` with a `Date` argument is a different API that takes the end date directly and does not crash.

**Trade-off**: The progress bar (`TimerProgressView`) is based on `remainingSeconds` and only updates on meaningful events, not every second. The countdown text remains accurate as it is rendered natively.
