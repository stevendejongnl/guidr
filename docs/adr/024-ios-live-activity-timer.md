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
