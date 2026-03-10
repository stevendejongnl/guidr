# Live Activity: Active But Invisible on Lock Screen / Notification Center

**Device**: iPhone 13 (no Dynamic Island)
**OS**: iOS 26 beta
**Status**: UNRESOLVED

---

## What Used To Work

Live Activities appeared correctly on the **lock screen** and **notification center** (top of screen) before `GuidrHomeWidget` was added to the widget extension bundle.

---

## What Changed (Root Cause of Original Break)

`GuidrHomeWidget` was added to `GuidrTimerWidgetBundle` — same process, same App Group UserDefaults as the Live Activity. This caused:

1. `saveWidgetState()` wrote to App Group UserDefaults with `synchronize()` immediately after `Activity.request()`
2. iOS 26 implicitly woke the widget extension on the UserDefaults write
3. Extension was asked to render Live Activity + home widget simultaneously
4. Extension exceeded time/memory budget → killed → instant dismissal

---

## Fixes Applied

### Fix 1 — Move `saveWidgetState()` before `Activity.request()` ✅ PARTIALLY WORKED
**File**: `mobile/ios/guidr/LiveActivityModule.swift`
**Result**: Activity no longer instantly dismissed. Now lives the correct duration:
```
state=active elapsed=0.000s
state=dismissed elapsed=35.616s  ← correct (30s timer + 3s grace)
```
**Remaining problem**: Activity is active for the full duration but **never visible** on lock screen or notification center.

### Fix 2 — Remove `synchronize()` from `SharedTimerStorage` and `DiagnosticLogger` ✅ APPLIED
**Files**: `SharedTimerStorage.swift`, `SharedDiagnosticLogger.swift`, `DiagnosticLogger.swift`
**Result**: No measurable effect on visibility.

### Fix 3 — Make `SharedDiagnosticLogger` async then sync ⚠️ DIAGNOSTIC ISSUE INTRODUCED
- Made writes `queue.async` (Plan step 3) → widget render logs are **silently lost** on process termination
- Reverted to `queue.sync` to recover render logs
- **We still have zero `[LiveActivityWidget]` or `[WidgetBundle]` log entries** in any test run

---

## Current Symptoms

```
[LiveActivity] startActivity stepId=... duration=30 remaining=30
[LiveActivity] areActivitiesEnabled=true
[LiveActivity] saveWidgetState done (create), entries=1
[LiveActivity] created new id=A977B8FF-...
[LiveActivity] stateUpdate state=active elapsed=0.000s
... (35 seconds of silence) ...
[LiveActivity] stateUpdate state=dismissed elapsed=35.616s
```

**Missing**: Any log from the widget extension process (`[WidgetBundle] init`, `[LiveActivityWidget] LockScreenView rendered`).

---

## What We Don't Know Yet

1. **Is the widget extension rendering the Live Activity at all?** No render logs — either:
   - Extension crashes before/during Live Activity render (most likely)
   - Extension renders but SharedDiagnosticLogger writes still lost (less likely after sync fix)

2. **Is the home widget rendering correctly?** If home widget renders fine but Live Activity crashes, that would narrow it down.

3. **Is there a crash log for `GuidrTimerWidget` extension?** We haven't checked Xcode crash logs or Console.app.

---

## Next Concrete Diagnostic Step

**Check widget extension crash logs in Xcode:**

1. Connect iPhone 13 to Mac
2. In Xcode: `Window → Devices and Simulators → iPhone 13 → View Device Logs`
3. Filter for `GuidrTimerWidget` or `com.guidr`
4. Trigger a timer → check if a crash report appears

**OR open Console.app** (Mac), select iPhone 13, filter for `GuidrTimerWidget` — crash reason will appear there immediately when the extension dies.

---

## Hypotheses Ranked by Likelihood

1. **Widget extension crashes on Live Activity render on iOS 26** — nothing in the code prevents this, and iOS 26 changed many SwiftUI APIs. Crash logs would confirm.

2. **`activityBackgroundTint(Color.black.opacity(0.85))` conflicts with iOS 26 Liquid Glass presentation** — might render as invisible/transparent. Try removing it.

3. **Missing capability in widget extension target** — iOS 17+ may require `NSSupportsLiveActivitiesFrequentUpdates` or ActivityKit entitlement in the extension's Info.plist, not just the main app.

4. **Both widgets in same bundle causes extension to hit budget** — even with our ordering fix, the extension might be asked to render both simultaneously and fail for the Live Activity specifically.

---

## Things NOT Tried Yet

- [ ] Check Xcode/Console crash logs for `GuidrTimerWidget` extension
- [ ] Remove `activityBackgroundTint` modifier and test
- [ ] Move `GuidrTimerWidgetLiveActivity` to a **separate widget extension** (isolated from home widget)
- [ ] Check widget extension's Info.plist for ActivityKit entitlements
- [ ] Test on iOS 17/18 device to isolate iOS 26 as the variable
