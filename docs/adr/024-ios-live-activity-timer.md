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
1. `tickCountdown()` still ticks every second to keep `timerEntries.remainingSeconds` current for in-app display, but only calls `activity.update()` every 30 ticks (≤2 updates/minute, ~120/hour worst-case — well within iOS budget of ~15/hour when backgrounded but safe when foregrounded).
2. All `activity.update()` calls now pass `staleDate: nil` to prevent iOS from pre-emptively marking content stale.
3. `TimerText` continues using `Text(formatTime(remainingSeconds))` — static text that is safe in the widget extension.

**Why system-driven Text APIs were not used**: Both `Text(timerInterval:countsDown:)` (commit 13fa1ca) and `Text(_:style:.timer)` (commit ea22de9) crash the widget extension immediately on Live Activity presentation. The crash is in the widget extension process, not the main app — the Live Activity is dismissed within <0.5s. Root cause is unknown (possibly an iOS 26 beta regression or an incompatibility with the `ActivityConfiguration` render context). Static text with periodic updates is the only confirmed stable approach.

**Trade-off**: The countdown display updates every 30s instead of every second, so displayed time may be up to 30s ahead of actual. Pause/resume/complete events still update immediately.

### TimelineView(.periodic) Does Not Work in Widget/LA Context (Fixed)

**Symptom**: After switching from 30s throttled updates to `TimelineView(.periodic(from: .now, by: 1.0))` in both the home widget and Live Activity, timers appeared frozen — only jumping occasionally (~60s for widget, ~30s for LA).

**Root cause**: `TimelineView(.periodic)` does not provide per-second re-renders in widget extension or Live Activity contexts on iOS 26. It works in regular app views but is ineffective in these constrained environments.

**Fix**:
1. **Home widget**: Removed `TimelineView` from `TimerCountdownText` and `HomeProgressView`. Uses `remainingSeconds` directly from pre-generated timeline entries (per-second for 2 min, then per-minute). iOS exhausts its widget reload budget after 1-2 `getTimeline` calls, so the full timeline must be generated upfront.
2. **Live Activity**: Uses `Text(timerInterval:countsDown:)` for OS-native per-second countdown — no periodic `activity.update()` calls needed. Activity is only updated on user actions (pause/resume/reset/complete). Previous periodic update approaches all failed: 1s → killed after ~12min, 5s → killed after ~38min. The earlier crashes with `Text(timerInterval:)` appear to have been an iOS 26 beta regression.

See `docs/debugging/widget-live-activity-history.md` for the full history of approaches tried.
