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

    let result = TimelineBuilder.buildTimeline(from: baseEntry)
    NSLog("[GuidrWidget] getTimeline: %d entries, refresh after %@",
          result.entries.count, String(describing: result.refreshDate))
    completion(Timeline(entries: result.entries, policy: .after(result.refreshDate)))
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
    if StalenessChecker.isStale(entries: state.entries, now: now) {
      NSLog("[GuidrWidget] buildEntry: stale — returning empty")
      return HomeWidgetEntry(date: now, entries: [], updatedAt: state.updatedAt)
    }

    NSLog("[GuidrWidget] buildEntry: returning %d entries", state.entries.count)
    return HomeWidgetEntry(date: now, entries: state.entries, updatedAt: state.updatedAt)
  }

}
