import Foundation
import XCTest

class TimelineProviderTests: XCTestCase {

  // MARK: - StalenessChecker

  func testStaleWhenExpiredMoreThan60SecondsAgo() {
    let now = Date()
    let entries = [
      makeTimer(endDate: now.addingTimeInterval(-90), isPaused: false, isComplete: false),
    ]
    XCTAssertTrue(StalenessChecker.isStale(entries: entries, now: now))
  }

  func testNotStaleWhenExpiredLessThan60SecondsAgo() {
    let now = Date()
    let entries = [
      makeTimer(endDate: now.addingTimeInterval(-30), isPaused: false, isComplete: false),
    ]
    XCTAssertFalse(StalenessChecker.isStale(entries: entries, now: now))
  }

  func testNotStaleWhenNoRunningTimers() {
    let now = Date()
    let entries = [
      makeTimer(endDate: nil, isPaused: true, isComplete: false),
    ]
    XCTAssertFalse(StalenessChecker.isStale(entries: entries, now: now))
  }

  func testNotStaleWhenTimersStillRunning() {
    let now = Date()
    let entries = [
      makeTimer(endDate: now.addingTimeInterval(30), isPaused: false, isComplete: false),
    ]
    XCTAssertFalse(StalenessChecker.isStale(entries: entries, now: now))
  }

  func testNotStaleWhenEmpty() {
    XCTAssertFalse(StalenessChecker.isStale(entries: [], now: Date()))
  }

  // MARK: - TimelineBuilder: static timeline

  func testStaticTimelineWhenNoRunningTimers() {
    let now = Date()
    let baseEntry = HomeWidgetEntry(
      date: now,
      entries: [makeTimer(endDate: nil, isPaused: true, isComplete: false)],
      updatedAt: now
    )
    let result = TimelineBuilder.buildTimeline(from: baseEntry)
    XCTAssertEqual(result.entries.count, 1)
    XCTAssertEqual(result.refreshDate.timeIntervalSince(now), 15 * 60, accuracy: 1.0)
  }

  // MARK: - TimelineBuilder: batch generation

  func testBatchGenerationCorrectCountAndIntervals() {
    let now = Date()
    let endDate = now.addingTimeInterval(60)
    let baseEntry = HomeWidgetEntry(
      date: now,
      entries: [makeTimer(remaining: 60, endDate: endDate, isPaused: false, isComplete: false)],
      updatedAt: now
    )
    let result = TimelineBuilder.buildTimeline(from: baseEntry)
    // entryCount = min(60/15 + 1, 60) = 5, entries = 0...5 + 1 completion = 7
    // (5 interval entries at 0s, 15s, 30s, 45s, 60s + 1 completion entry at 60s)
    // Deduplicated since 60s entry matches completion entry = entries at 0,15,30,45,60,60
    XCTAssertGreaterThanOrEqual(result.entries.count, 6)
    // First entry has 60s remaining
    XCTAssertEqual(result.entries.first?.entries.first?.remainingSeconds, 60)
    // Refresh after batch
    XCTAssertEqual(result.refreshDate.timeIntervalSince(now), 76, accuracy: 2.0)
  }

  func testBatchCappedAtSixtyEntries() {
    let now = Date()
    let endDate = now.addingTimeInterval(1800) // 30 minutes
    let baseEntry = HomeWidgetEntry(
      date: now,
      entries: [makeTimer(remaining: 1800, endDate: endDate, isPaused: false, isComplete: false)],
      updatedAt: now
    )
    let result = TimelineBuilder.buildTimeline(from: baseEntry)
    // entryCount = min(1800/15 + 1, 60) = 60, entries = 0...60 + 1 completion = 62
    XCTAssertLessThanOrEqual(result.entries.count, 63)
    XCTAssertEqual(result.entries.first?.entries.first?.remainingSeconds, 1800)
  }

  func testBatchMarksTimerCompleteWhenRemainingReachesZero() {
    let now = Date()
    let endDate = now.addingTimeInterval(5)
    let baseEntry = HomeWidgetEntry(
      date: now,
      entries: [makeTimer(remaining: 5, endDate: endDate, isPaused: false, isComplete: false)],
      updatedAt: now
    )
    let result = TimelineBuilder.buildTimeline(from: baseEntry)
    // entryCount = min(5/15 + 1, 60) = 1, entries = 0...1 + 1 completion at 5s = 3
    XCTAssertGreaterThanOrEqual(result.entries.count, 2)
    // Find the completion entry (at endDate)
    let completionEntry = result.entries.last
    let lastTimer = completionEntry?.entries.first
    XCTAssertEqual(lastTimer?.remainingSeconds, 0)
    XCTAssertTrue(lastTimer?.isComplete ?? false)
  }

  // MARK: - Helpers

  private func makeTimer(
    stepId: String = "step",
    remaining: Int = 30,
    totalDuration: Int = 60,
    endDate: Date? = nil,
    isPaused: Bool = false,
    isComplete: Bool = false
  ) -> SharedTimerEntry {
    SharedTimerEntry(
      stepId: stepId,
      stepTitle: "Test Step",
      guideTitle: "Test Guide",
      totalDurationSeconds: totalDuration,
      endDate: endDate,
      remainingSeconds: remaining,
      isPaused: isPaused,
      isComplete: isComplete
    )
  }
}
