# Widget & Live Activity Timer History

Institutional knowledge documenting all attempts, failures, and successes with iOS home screen widgets and Live Activities. This prevents repeating failed approaches.

## Phase 1: Initial Implementation (2026-02-11)

| Commit | Description |
|--------|-------------|
| `fe65ee9` | feat: add iOS Live Activity with `Text(timerInterval:countsDown:)` for OS-native countdown |
| `944ebf7` | feat: add progress bar, native completion, multi-timer support |
| `c6f1ac8` | fix: availability checks to iOS 16.2 |
| `871c4f1`, `989151e` | fix: widget extension Info.plist entries |

## Phase 2: Home Widget + First Crashes (2026-02-11 – 2026-02-13)

| Commit | Description |
|--------|-------------|
| `5f4089d` | feat: add iOS home screen widget via SharedTimerStorage |
| `8624852` | fix: prevent Live Activity kill on navigation (useEffect cleanup was ending LA) |
| `b510c8d` | fix: prevent widget flickering during timer completion (staleness detection) |
| `4e3d802` | **FAILURE**: TOCTOU race in countdown views causing crash (Date() between checks) |
| `996efe3` | fix: adapt for iOS 26 Liquid Glass + cross-process reliability |
| `5d24ce4` | **KEY CHANGE**: replace auto-updating views with multi-entry timeline (Text(timerInterval:) didn't render on iOS 26 — black screens) |

## Phase 3: iOS 26 Live Activity Visibility Saga (2026-03-09 – 2026-03-10)

| Commit | Description |
|--------|-------------|
| `687f150` | fix: add NSSupportsLiveActivities to widget extension plist |
| `ced33a0` | add diagnostic logging to surface blocked/unavailable state |
| `c88d29d` | fix: delay widget reload, eliminate double addTimer call |
| `d09d1ab`, `9b36b46`, `018b538` | diagnostic logging for widget extension rendering |
| `f91c436` | fix: queue.sync in SharedDiagnosticLogger to prevent log loss on widget termination |
| `464dedc` | **KEY FIX**: move saveWidgetState before Activity.request (iOS 26 instant dismissal) |
| `801cf84` | isolate GuidrHomeWidget from LiveActivity in bundle |
| `35126de` | fix: restore GuidrHomeWidget in bundle for TestFlight |
| `b8f10b8` | bump deployment target to iOS 26 |
| `4c2e12f` | add supplementalActivityFamilies for iOS 26 |
| `970f710` | fix: explicit return for DynamicIsland after log statement |

## Phase 4: Rendering Crashes (2026-03-11 – 2026-03-12)

| Commit | Description |
|--------|-------------|
| `e517e64` | **FAILURE**: supplementalActivityFamilies broke iPhone 13 rendering, removed |
| `21151b7` | try containerBackground API for lock screen → `fae7f75` reverted |
| `d839b0e` | fix: background thread init for LiveActivityModule |
| `90fc0a1` | reduce widget reload delay to 1s |
| `a648d8d` | **KEY FIX**: ProgressView(timerInterval:) crashes via GeometryReader assertion, replaced with static ProgressView |
| `4688bc7` | **FAILURE**: Text(timerInterval:) also crashes in LA via GeometryReader, replaced with static text |
| `f7e7fb3` | **SUCCESS**: native DispatchSourceTimer ticks every 1s, calls activity.update() every tick — countdown works! |

## Phase 5: System Text API Attempts (2026-03-12 – 2026-03-13)

| Commit | Description |
|--------|-------------|
| `ca55db8` | try Text(timerInterval:) + ProgressView(timerInterval:) in home widget |
| `91ec8af` | **FAILURE**: same crash in home widget, reverted to static views with 1s timeline entries |
| `13fa1ca` | try Text(timerInterval:countsDown:) for drift-free countdown |
| `be76e78` | **FAILURE**: crashes widget extension (<0.5s dismissal), reverted |

## Phase 6: Timer Freeze Fix Attempts (2026-03-16)

| Commit | Description |
|--------|-------------|
| `ea22de9` | try Text(_, style: .timer) to prevent 15min display freeze |
| `98f473a` | **FAILURE**: Text(_, style: .timer) also crashes, throttle activity.update() to 30s — timer jumps every 30s on Live Activity |
| `9519bb8` | add TimelineView(.periodic) for smooth countdown + per-minute entries for home widget — **FAILURE**: TimelineView doesn't re-render per-second in widget/LA context |

## Phase 7: Xcode 16.2 Downgrade — Native Timer APIs Restored (2026-03-17)

**Root cause identified**: The crash in `Text(timerInterval:countsDown:)`, `Text(_, style: .timer)`, and `ProgressView(timerInterval:)` is an **Xcode 26 SDK-linked regression**, not a deployment target issue. iOS 26 provides backwards-compatible behavior for binaries compiled with older SDKs — the runtime uses a legacy code path that works correctly. Mobileraker (compiled with Xcode 15.1) uses these APIs successfully on iOS 26.

**Solution**: Downgrade from Xcode 26 to Xcode 16.2, compiling against the iOS 16.2 SDK. This enables all native auto-updating SwiftUI APIs.

| Change | Description |
|--------|-------------|
| Podfile + pbxproj | deployment target 26.0 → 16.2 |
| CI workflows | `macos-26` → `macos-15` runners (Xcode 16.x pre-installed) |
| `GuidrTimerWidgetLiveActivity.swift` | Restored `Text(timerInterval:countsDown:)` + `ProgressView(timerInterval:)` for LA |
| `GuidrHomeWidget.swift` | Restored `Text(timerInterval:countsDown:)` + `ProgressView(timerInterval:)` for home widget |
| `TimerFormatting.swift` | Simplified timeline to 2 entries (current + completion) — OS handles countdown |
| `LiveActivityModule.swift` | Removed 15s throttled `activity.update()` — no longer needed |

**Result**: Per-second countdown rendered natively by the OS in both widget and Live Activity. No periodic updates needed. No hybrid timeline needed. Eliminates all workarounds from Phases 4-6.

## Key Learnings

### What CRASHES on iOS 26 Widget Extension

1. **`Text(timerInterval:countsDown:)`** — GeometryReader EXC_BREAKPOINT crash. Mobileraker uses this API successfully because their binary is compiled with **Xcode 15.1** (iOS 18 SDK). iOS 26 provides backwards-compatible behavior for binaries compiled with older SDKs. When compiled with **Xcode 26** (iOS 26 SDK), the runtime uses a new (buggy) code path that crashes. Tested with deployment targets 16.2 and 26.0 — both crash. **This is an Xcode 26 SDK-linked regression**, not a deployment target issue. Will be fixed when Apple patches the bug.
2. **`Text(_, style: .timer)`** — Same crash mechanism
3. **`Text(date, style: .relative)`** — Also crashes (tested 2026-03-17)
4. **`ProgressView(timerInterval:)`** — Same crash mechanism
5. **`supplementalActivityFamilies`** — Broke iPhone 13 rendering

### What DOES NOT WORK (no crash, just broken)

6. **`TimelineView(.periodic(from: .now, by: 1.0))`** — Does NOT re-render per-second in widget/LA contexts on iOS 26. Timer appears frozen.
7. **`activity.update()` every 1s** — iOS kills the Live Activity within 1 minute due to excessive update overhead (watchdog + widget extension re-render per update).
8. **Full per-second widget timeline** — 3600 entries = 18MB timeline archive. iOS rejects with "too large timeline archive" error.
9. **Rolling window widget timeline** — iOS exhausts its widget reload budget after 1-2 `getTimeline` calls and never calls again. Window expires, widget freezes.

### What WORKS

10. **`activity.update()` every 15s** — Use static text + periodic updates at 15s intervals. Tested: 1s → killed <1min, 5s → killed ~38min, **15s → stable**. Display jumps by up to 15s but LA stays alive. Only updates while app is in foreground (DispatchSourceTimer suspended when backgrounded).
11. **Hybrid widget timeline** — Per-second for first 5 min (300 entries) + per-minute on :00 boundaries for middle + per-second for last 5 min (300 entries). 60-min timer ≈ 650 entries (~3.3MB). Timers ≤10 min are all per-second.
12. **`saveWidgetState` before `Activity.request`** — Required on iOS 26 to prevent instant dismissal.
13. **Static text + static ProgressView** — Required for both home widget and Live Activity on iOS 26. ALL auto-updating view APIs crash the widget extension.
14. **Widget reload from foreground tick** — Calling `reloadTimelines` every 15s from the foreground tick handler gives the widget fresh per-second entries while the app is open.
15. **Xcode 16.2 downgrade** — Compiling with Xcode 16.2 (iOS 16.2 SDK) instead of Xcode 26 enables all native auto-updating Text/ProgressView APIs. The crash is SDK-linked: iOS 26 provides backwards-compatible behavior for binaries built with older SDKs. See Phase 7.
