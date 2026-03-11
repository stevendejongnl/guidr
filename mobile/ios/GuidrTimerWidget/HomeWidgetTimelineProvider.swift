import SwiftUI
import WidgetKit

struct HomeWidgetEntry: TimelineEntry {
  let date: Date
  let entries: [SharedTimerEntry]
  let updatedAt: Date?

  var hasTimers: Bool {
    !entries.isEmpty
  }

  var activeEntries: [SharedTimerEntry] {
    entries.filter { !$0.isComplete }
  }

  var activeCount: Int {
    activeEntries.count
  }

  var allComplete: Bool {
    !entries.isEmpty && activeEntries.isEmpty
  }

  /// Soonest running timer > first paused > first entry (mirrors LiveActivityModule.buildContentState)
  var primaryEntry: SharedTimerEntry? {
    let running = activeEntries.filter { !$0.isPaused && $0.endDate != nil }
    return running.min(by: { ($0.endDate ?? .distantFuture) < ($1.endDate ?? .distantFuture) })
      ?? activeEntries.first
      ?? entries.first
  }
}

struct HomeWidgetTimelineProvider: TimelineProvider {
  func placeholder(in context: Context) -> HomeWidgetEntry {
    HomeWidgetEntry(date: Date(), entries: [], updatedAt: nil)
  }

  func getSnapshot(in context: Context, completion: @escaping (HomeWidgetEntry) -> Void) {
    NSLog("[GuidrWidget] getSnapshot called (isPreview=%d)", context.isPreview ? 1 : 0)
    completion(buildEntry())
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<HomeWidgetEntry>) -> Void) {
    SharedDiagnosticLogger.shared.log("[HomeWidget] getTimeline called — this wake is for the home widget")
    NSLog("[GuidrWidget] getTimeline called")
    let baseEntry = buildEntry()

    let running = baseEntry.entries.filter { !$0.isPaused && !$0.isComplete && $0.endDate != nil }

    if running.isEmpty {
      // Static timeline — no running timers, single entry is sufficient
      let fallbackRefresh = Date().addingTimeInterval(15 * 60)
      NSLog("[GuidrWidget] getTimeline: static (no running timers), refresh after %@",
            String(describing: fallbackRefresh))
      completion(Timeline(entries: [baseEntry], policy: .after(fallbackRefresh)))
      return
    }

    // Multi-entry timeline for running timers
    let entries = generateTimelineEntries(base: baseEntry)
    let soonestEnd = running.compactMap(\.endDate).min()!
    let refreshDate = soonestEnd.addingTimeInterval(1)
    NSLog("[GuidrWidget] getTimeline: multi-entry (%d entries), refresh after %@",
          entries.count, String(describing: refreshDate))
    completion(Timeline(entries: entries, policy: .after(refreshDate)))
  }

  private func buildEntry() -> HomeWidgetEntry {
    guard let state = SharedTimerStorage.shared.load() else {
      NSLog("[GuidrWidget] buildEntry: no stored state — returning empty entry")
      return HomeWidgetEntry(date: Date(), entries: [], updatedAt: nil)
    }
    NSLog("[GuidrWidget] buildEntry: loaded %d entries, updatedAt=%@",
          state.entries.count, String(describing: state.updatedAt))

    let now = Date()

    // Staleness detection: if all endDates have passed and the latest one expired
    // more than 60 seconds ago, the app was likely killed — treat as no active timers.
    // Uses expiry-based grace period (not updatedAt) to avoid racing with handleTimerCompletion.
    let running = state.entries.filter { !$0.isPaused && !$0.isComplete && $0.endDate != nil }
    let allExpired = running.allSatisfy { ($0.endDate ?? .distantPast) < now }
    let latestExpiry = running.compactMap(\.endDate).max()
    let secondsSinceExpiry = latestExpiry.map { now.timeIntervalSince($0) } ?? 0
    let stale = allExpired && !running.isEmpty && secondsSinceExpiry > 60

    if stale {
      NSLog("[GuidrWidget] buildEntry: stale (%.1fs since expiry) — returning empty", secondsSinceExpiry)
      return HomeWidgetEntry(date: now, entries: [], updatedAt: state.updatedAt)
    }

    NSLog("[GuidrWidget] buildEntry: returning %d entries (running=%d, stale=%d)",
          state.entries.count, running.count, stale ? 1 : 0)
    return HomeWidgetEntry(date: now, entries: state.entries, updatedAt: state.updatedAt)
  }

  /// Generate timeline entries at adaptive intervals for smooth countdown display.
  /// Cadence: >10 min → 60s, 1–10 min → 15s, <1 min → 1s.
  private func generateTimelineEntries(base: HomeWidgetEntry) -> [HomeWidgetEntry] {
    let now = base.date
    let running = base.entries.filter { !$0.isPaused && !$0.isComplete && $0.endDate != nil }
    guard let soonestEnd = running.compactMap(\.endDate).min(),
          soonestEnd.timeIntervalSince(now) > 0 else {
      return [base]
    }

    // Build adaptive entry dates
    var entryDates: [Date] = []
    var t = now
    while t < soonestEnd {
      entryDates.append(t)
      let remaining = soonestEnd.timeIntervalSince(t)
      if remaining > 600 {
        t = t.addingTimeInterval(60)
      } else if remaining > 60 {
        t = t.addingTimeInterval(15)
      } else {
        t = t.addingTimeInterval(1)
      }
    }
    // Final entry at endDate marks timer as complete
    entryDates.append(soonestEnd)

    // Safety cap: keep at most 280 entries (WidgetKit limit is 300).
    // Preserve the tail (finer granularity near completion).
    if entryDates.count > 280 {
      entryDates = Array(entryDates.suffix(280))
    }

    return entryDates.map { entryDate in
      let adjustedEntries = base.entries.map { timer -> SharedTimerEntry in
        // Only adjust running timers — paused/complete stay as-is
        guard !timer.isPaused && !timer.isComplete, let endDate = timer.endDate else {
          return timer
        }
        let remaining = max(0, Int(endDate.timeIntervalSince(entryDate)))
        return SharedTimerEntry(
          stepId: timer.stepId,
          stepTitle: timer.stepTitle,
          guideTitle: timer.guideTitle,
          totalDurationSeconds: timer.totalDurationSeconds,
          endDate: timer.endDate,
          remainingSeconds: remaining,
          isPaused: timer.isPaused,
          isComplete: remaining <= 0
        )
      }
      return HomeWidgetEntry(date: entryDate, entries: adjustedEntries, updatedAt: base.updatedAt)
    }
  }
}
