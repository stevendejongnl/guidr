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

## Key Learnings

### What CRASHES on iOS 26 Widget Extension

1. **`Text(timerInterval:countsDown:)`** — GeometryReader EXC_BREAKPOINT crash
2. **`Text(_, style: .timer)`** — Same crash mechanism
3. **`ProgressView(timerInterval:)`** — Same crash mechanism
4. **`supplementalActivityFamilies`** — Broke iPhone 13 rendering

### What DOES NOT WORK (no crash, just broken)

4. **`TimelineView(.periodic(from: .now, by: 1.0))`** — Does NOT re-render per-second in widget/LA contexts on iOS 26. Timer appears frozen.

### What WORKS

5. **`activity.update()` every 1s from DispatchSourceTimer** — Proven in commit `f7e7fb3` for Live Activity. Apple docs confirm foreground `activity.update()` calls are unlimited.
6. **Per-second timeline entries** — Works for home widget (commit `91ec8af`). Needs rolling window (max ~240 entries) with early refresh for long timers.
7. **`saveWidgetState` before `Activity.request`** — Required on iOS 26 to prevent instant dismissal.
8. **Static text + static ProgressView** — The only stable rendering approach in widget extension on iOS 26.
