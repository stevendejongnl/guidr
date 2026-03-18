import ActivityKit
import Foundation
import SwiftUI

// MARK: - Timer Formatting

enum TimerFormatting {
  static func formatTime(_ seconds: Int) -> String {
    let mins = seconds / 60
    let secs = seconds % 60
    return String(format: "%02d:%02d", mins, secs)
  }

  static func staticProgress(remaining: Int, total: Int) -> Double {
    guard total > 0 else { return 0 }
    let rem = Double(max(0, remaining))
    return 1.0 - (rem / Double(total))
  }

  static func progressColor(remaining: Int, total: Int) -> Color {
    guard total > 0 else { return .green }
    let ratio = Double(remaining) / Double(total)
    if ratio > 0.5 {
      return .green
    } else if ratio > 0.25 {
      return .yellow
    } else {
      return .red
    }
  }
}

// MARK: - Content State Builder

enum ContentStateBuilder {
  static func build(from entries: [SharedTimerEntry]) -> GuidrTimerAttributes.ContentState {
    let active = entries.filter { !$0.isComplete }
    let running = active.filter { !$0.isPaused && $0.endDate != nil }

    let primary = running.min(by: { ($0.endDate ?? .distantFuture) < ($1.endDate ?? .distantFuture) })
      ?? active.first
      ?? entries.first

    let allDone = active.isEmpty && !entries.isEmpty

    return GuidrTimerAttributes.ContentState(
      stepTitle: allDone ? "All done!" : (primary?.stepTitle ?? ""),
      totalDurationSeconds: primary?.totalDurationSeconds ?? 0,
      timerEndDate: primary?.endDate,
      remainingSeconds: primary?.remainingSeconds ?? 0,
      isPaused: primary?.isPaused ?? false,
      isComplete: allDone,
      activeTimerCount: active.count
    )
  }
}

// MARK: - Staleness Checker

enum StalenessChecker {
  static func isStale(entries: [SharedTimerEntry], now: Date, graceSeconds: TimeInterval = 60) -> Bool {
    let running = entries.filter { !$0.isPaused && !$0.isComplete && $0.endDate != nil }
    guard !running.isEmpty else { return false }
    let allExpired = running.allSatisfy { ($0.endDate ?? .distantPast) < now }
    let latestExpiry = running.compactMap(\.endDate).max()
    let secondsSinceExpiry = latestExpiry.map { now.timeIntervalSince($0) } ?? 0
    return allExpired && secondsSinceExpiry > graceSeconds
  }
}

// MARK: - Timeline Builder

enum TimelineBuilder {
  struct TimelineResult {
    let entries: [HomeWidgetEntry]
    let refreshDate: Date
  }

  static func buildTimeline(from baseEntry: HomeWidgetEntry) -> TimelineResult {
    let running = baseEntry.entries.filter { !$0.isPaused && !$0.isComplete && $0.endDate != nil }

    if running.isEmpty {
      let fallbackRefresh = baseEntry.date.addingTimeInterval(15 * 60)
      return TimelineResult(entries: [baseEntry], refreshDate: fallbackRefresh)
    }

    let soonestEnd = running.compactMap(\.endDate).min()!

    // With native Text(timerInterval:countsDown:), the OS renders the countdown
    // automatically. No more per-second entries needed — just current state +
    // completion state. Compiled with Xcode 16.2 (older SDK) to avoid the
    // Xcode 26 SDK-linked crash in auto-updating Text/ProgressView APIs.
    var entries: [HomeWidgetEntry] = [baseEntry]
    let completionEntries = adjust(baseEntry.entries, at: soonestEnd)
    entries.append(HomeWidgetEntry(date: soonestEnd, entries: completionEntries, updatedAt: baseEntry.updatedAt))

    let refreshDate = soonestEnd.addingTimeInterval(5)
    return TimelineResult(entries: entries, refreshDate: refreshDate)
  }

  private static func adjust(_ timers: [SharedTimerEntry], at entryDate: Date) -> [SharedTimerEntry] {
    timers.map { timer in
      guard !timer.isPaused && !timer.isComplete, let endDate = timer.endDate else { return timer }
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
  }
}
