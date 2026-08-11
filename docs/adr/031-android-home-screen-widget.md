# ADR-031: Android Home Screen Widget for Timer Countdown

**Status:** Accepted
**Date:** 2026-08-11
**Authors:** Steven de Jong, Claude

## Context

iOS shipped a home screen widget (ADR-025) and a lock-screen/Dynamic Island Live Activity (ADR-024) for the active step timer, so users could track progress without opening the app. Both were removed along with the rest of the iOS platform (ADR-029). Now that Android is the only mobile target, the same "see your timer without opening the app" need still exists — the user asked for the Android equivalent of the iOS widget.

Android's home screen App Widget system is architecturally simpler than what iOS needed:

- **No separate process / App Group.** iOS widgets run in their own extension process and need `UserDefaults(suiteName:)` shared storage plus `WidgetCenter.shared.reloadTimelines()` to request a refresh (ADR-025). Android's `AppWidgetProvider` is just a `BroadcastReceiver` in the main app process — it can read `SharedPreferences` directly, and the app can push an immediate render via `AppWidgetManager.updateAppWidget()`.
- **A native live-ticking countdown, for free.** ADR-024 documents months of iOS Live Activity instability — `Text(timerInterval:countsDown:)` and `Text(_:style:.timer)` crashed the widget extension outright, `TimelineView(.periodic)` didn't fire in widget contexts, and iOS's ~15 updates/hour background budget forced throttling the display to update every 15–30s instead of every second. Android's `RemoteViews.setChronometer(viewId, base, format, isCountDown)` + `setChronometerCountDown(viewId, true)` gives a genuine per-second system-rendered countdown with zero polling from the app — the OS ticks it, not JS or a background timer.

## Decision

Add a home screen widget (`GuidrTimerWidgetProvider`) showing the active countdown timer, matching the iOS widget's scope as closely as makes sense on Android:

### Architecture
- **`GuidrTimerWidgetProvider`** (`AppWidgetProvider`): reads/writes timer state via `SharedPreferences` (`guidr_widget_prefs`), builds `RemoteViews` on every update, calls `AppWidgetManager.updateAppWidget()`.
- **`WidgetModule`** (React Native bridge, mirrors the deleted `LiveActivityModule` bridge pattern): exposes `updateWidget(...)` and `clearWidget()` to JS.
- **`WidgetService.ts`** (mirrors the deleted `LiveActivityService.ts`): platform-gated (`Platform.OS === 'android'`), silent-fail wrapper around the native module.
- **Integration**: wired into `GuideDetailScreen`'s existing `onStart`/`onPause`/`onReset` timer callbacks and the timer-completion effect — the same call sites `useLiveActivity` used before it was removed.
- **Sizes**: small (title + countdown) and medium (adds guide title + progress bar) layouts, selected via the size-aware `RemoteViews(Map<SizeF, RemoteViews>)` constructor (API 31+). Both of the devices used for manual testing (ADR-030) are API 31+; pre-31 devices fall back to the medium layout unconditionally.
- **Widget picker preview**: `android:previewLayout` (API 31+) renders the actual medium layout — with its idle-state default text ("No active timer" / "Open Guidr to start a step") — as the picker preview, instead of the app's launcher icon. `android:previewImage` is kept as the pre-31 fallback.
- **Tap to open**: the widget's root view carries a `PendingIntent` (explicit `Intent` to `MainActivity`, rebuilt on every widget refresh so its extras stay current). With an active (running/paused/complete) timer, it carries `guide_id`/`step_id` extras; idle/stale, it carries none. `MainActivity.onNewIntent` keeps the stored intent fresh for a warm app (singleTask launch mode), and `WidgetModule.getAndClearWidgetLaunchTarget()` reads-and-clears those extras once, consumed from JS on cold start and on every `AppState` 'active' transition. `AppNavigator` routes straight to `GuideDetailScreen` for that guide, which scrolls (via `measureLayout` against the screen's `ScrollView`) to the specific step's timer. Tapping an idle widget just opens the app normally.

### Scope (matching ADR-024's iOS constraints)
- **Countdown mode only** — steps with `duration > 0`. Stopwatch-mode steps (count up, no target end) don't populate the widget, same as iOS.
- **Single active widget at a time, last-write-wins** — starting a new timer replaces whatever the widget was showing, matching ADR-024's "new timer replaces existing." Pausing or resetting a *different* step than the one currently shown will still update/clear the widget; this was already an accepted limitation on iOS and isn't a new regression.
- **Progress bar updates only on meaningful events** (start/pause/step change/completion), not every second — identical trade-off to ADR-024's Live Activity progress bar.
- **Staleness fallback**: if a "running" timer's state hasn't been refreshed in 6 hours, the widget renders idle instead of trusting a countdown that may have run past zero (the app was likely killed). This is a coarser, simpler version of ADR-025's 10-second staleness check — Android's Chronometer ticks independently of the app, so there's no equivalent need to detect staleness on every widget refresh; this is purely a safety net for the "app was killed mid-timer" edge case.

## Consequences

### Positive
- Live, per-second countdown with none of the reliability problems ADR-024 spent months fighting on iOS.
- No cross-process data sharing complexity — same process, direct `SharedPreferences` access.
- No additional runtime permission required (home screen widgets don't need a user grant beyond placing the widget itself).

### Negative
- Cannot be automatically verified — no instrumented widget tests exist, and CI's "Android Build" job only compiles the code, it doesn't render or exercise the widget (see ADR-030). Verification is manual, on-device only. This now also covers the tap-to-open deep link and the scroll-to-step behavior in `GuideDetailScreen`, neither of which react-test-renderer can exercise (no real layout engine, so `measureLayout` can only be typechecked, not behaviorally tested).
- Multi-timer scenarios (pausing a step that isn't the one currently shown in the widget) will show incorrect widget state — an accepted limitation carried over from iOS, not fixed here.

## References

- **Superseded iOS features:** [ADR-024](./024-ios-live-activity-timer.md) (Live Activity), [ADR-025](./025-ios-home-screen-widget.md) (home widget) — kept as historical record per [ADR-029](./029-remove-ios-platform-support.md)
- **Related:** [ADR-030](./030-manual-device-testing-strategy.md) — this feature's verification relies entirely on the manual device testing strategy described there
