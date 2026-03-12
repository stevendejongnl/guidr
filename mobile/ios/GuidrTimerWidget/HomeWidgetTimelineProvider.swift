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

    // Generate 1-second entries for smooth countdown. Cap at 60 entries per batch
    // (well within WidgetKit's ~300 limit) and reload for the next batch.
    let soonestEnd = running.compactMap(\.endDate).min()!
    let secondsLeft = max(1, Int(ceil(soonestEnd.timeIntervalSince(baseEntry.date))))
    let batchSize = min(secondsLeft, 60)

    var entries: [HomeWidgetEntry] = []
    let now = baseEntry.date
    for i in 0...batchSize {
      let entryDate = now.addingTimeInterval(Double(i))
      let adjustedEntries = baseEntry.entries.map { timer -> SharedTimerEntry in
        guard !timer.isPaused && !timer.isComplete, let endDate = timer.endDate else {
          return timer
        }
        let remaining = max(0, Int(ceil(endDate.timeIntervalSince(entryDate))))
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
      entries.append(HomeWidgetEntry(date: entryDate, entries: adjustedEntries, updatedAt: baseEntry.updatedAt))
    }

    // Refresh after this batch ends (or after timer completes)
    let refreshDate = now.addingTimeInterval(Double(batchSize) + 1)
    NSLog("[GuidrWidget] getTimeline: %d entries at 1s intervals, refresh after %@",
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

}
