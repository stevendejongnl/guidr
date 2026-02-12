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
    completion(buildEntry())
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<HomeWidgetEntry>) -> Void) {
    let entry = buildEntry()

    // Determine refresh policy
    let refreshDate: Date?
    if entry.hasTimers {
      let running = entry.entries.filter { !$0.isPaused && !$0.isComplete && $0.endDate != nil }
      let soonest = running.compactMap(\.endDate).min()
      refreshDate = soonest.map { $0.addingTimeInterval(1) }
    } else {
      refreshDate = nil
    }

    let policy: TimelineReloadPolicy = refreshDate.map { .after($0) } ?? .never
    completion(Timeline(entries: [entry], policy: policy))
  }

  private func buildEntry() -> HomeWidgetEntry {
    guard let state = SharedTimerStorage.shared.load() else {
      return HomeWidgetEntry(date: Date(), entries: [], updatedAt: nil)
    }

    let now = Date()

    // Staleness detection: if all endDates have passed and updatedAt is old,
    // the app was likely killed — treat as no active timers
    let running = state.entries.filter { !$0.isPaused && !$0.isComplete && $0.endDate != nil }
    let allExpired = running.allSatisfy { ($0.endDate ?? .distantPast) < now }
    let stale = allExpired && !running.isEmpty && now.timeIntervalSince(state.updatedAt) > 10

    if stale {
      return HomeWidgetEntry(date: now, entries: [], updatedAt: state.updatedAt)
    }

    return HomeWidgetEntry(date: now, entries: state.entries, updatedAt: state.updatedAt)
  }
}
