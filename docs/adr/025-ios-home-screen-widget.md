# ADR-025: iOS Home Screen Widget

## Status
Accepted

## Context
The app has a working Live Activity for timer countdowns on the lock screen and Dynamic Island (ADR-024). Users also want to see timer progress from the home screen without opening the app. The existing `GuidrTimerWidgetExtension` target, App Group (`group.com.guidr`), and widget bundle already exist but only contain the Live Activity.

Home screen widgets run in a separate process and cannot access the main app's in-memory state. A cross-process data sharing mechanism is needed.

## Decision
Add small and medium home screen widgets alongside the existing Live Activity within the same widget extension target.

### Architecture
- **SharedTimerStorage**: A `Codable` data layer that writes timer state to App Group `UserDefaults(suiteName: "group.com.guidr")`. Shared between the main app target and widget extension target.
- **HomeWidgetTimelineProvider**: Reads from `SharedTimerStorage`, selects the primary timer using the same logic as the Live Activity (`buildContentState()`), and computes timeline refresh policies.
- **GuidrHomeWidget**: `StaticConfiguration` widget supporting `.systemSmall` and `.systemMedium` families. Reuses visual patterns (GuidrDots, progress colors, countdown text) from the Live Activity.
- **LiveActivityModule sync**: Every mutation (`startActivity`, `updateActivity`, `removeTimer`, `handleTimerCompletion`, `endActivity`) writes state via `SharedTimerStorage.shared.save()` and triggers `WidgetCenter.shared.reloadTimelines()`.

### Staleness detection
If all timer `endDate`s have passed but `updatedAt` is older than 10 seconds, the widget assumes the app was killed and displays idle state instead of stale countdowns.

### iOS compatibility
- Uses `StaticConfiguration` (iOS 16.0+) rather than `AppIntentConfiguration` (iOS 17+) to match the deployment target of 16.1.
- `containerBackground(for:)` with iOS 16 fallback via `widgetBackground()` modifier.

## Consequences
- Widget state is eventually consistent — there's a brief delay between timer mutations and widget refresh.
- `SharedTimerStorage.swift` must be added to both the main app and widget extension build phases (same pattern as `GuidrTimerAttributes.swift`).
- No changes to TypeScript/React Native code, entitlements, or provisioning profiles.
- The Live Activity remains completely unchanged.
