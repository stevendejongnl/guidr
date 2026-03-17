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
    let endDate = now.addingTimeInterval(30)
    let baseEntry = HomeWidgetEntry(
      date: now,
      entries: [makeTimer(remaining: 30, endDate: endDate, isPaused: false, isComplete: false)],
      updatedAt: now
    )
    let result = TimelineBuilder.buildTimeline(from: baseEntry)
    // windowSize = min(30, 240) = 30, entries = 0...30 = 31
    XCTAssertEqual(result.entries.count, 31)
    // First entry has 30s remaining, last has 0s
    XCTAssertEqual(result.entries.first?.entries.first?.remainingSeconds, 30)
    XCTAssertEqual(result.entries.last?.entries.first?.remainingSeconds, 0)
    // Refresh 30s before window runs out: max(1, 30-30) = 1
    XCTAssertEqual(result.refreshDate.timeIntervalSince(now), 1, accuracy: 1.0)
  }

  func testLongTimerUsesPerSecondEntries() {
    let now = Date()
    let endDate = now.addingTimeInterval(120)
    let baseEntry = HomeWidgetEntry(
      date: now,
      entries: [makeTimer(remaining: 120, endDate: endDate, isPaused: false, isComplete: false)],
      updatedAt: now
    )
    let result = TimelineBuilder.buildTimeline(from: baseEntry)
    // windowSize = min(120, 240) = 120, entries = 0...120 = 121
    XCTAssertEqual(result.entries.count, 121)
    XCTAssertEqual(result.entries.first?.entries.first?.remainingSeconds, 120)
    // Last entry at t=120s should have 0s remaining
    XCTAssertEqual(result.entries.last?.entries.first?.remainingSeconds, 0)
    // Refresh 30s before window runs out: max(1, 120-30) = 90
    XCTAssertEqual(result.refreshDate.timeIntervalSince(now), 90, accuracy: 1.0)
  }

  func testLongTimerRefreshDateIs30sBeforeWindowEnd() {
    let now = Date()
    let endDate = now.addingTimeInterval(300) // 5 minutes
    let baseEntry = HomeWidgetEntry(
      date: now,
      entries: [makeTimer(remaining: 300, endDate: endDate, isPaused: false, isComplete: false)],
      updatedAt: now
    )
    let result = TimelineBuilder.buildTimeline(from: baseEntry)
    // windowSize = min(300, 240) = 240, refresh = max(1, 240-30) = 210
    XCTAssertEqual(result.refreshDate.timeIntervalSince(now), 210, accuracy: 1.0)
  }

  func testVeryLongTimerCappedAt240SecondEntries() {
    let now = Date()
    let endDate = now.addingTimeInterval(3 * 60 * 60) // 3 hours
    let baseEntry = HomeWidgetEntry(
      date: now,
      entries: [makeTimer(remaining: 3 * 60 * 60, endDate: endDate, isPaused: false, isComplete: false)],
      updatedAt: now
    )
    let result = TimelineBuilder.buildTimeline(from: baseEntry)
    // windowSize = min(10800, 240) = 240, entries = 0...240 = 241
    XCTAssertEqual(result.entries.count, 241)
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
    // batchSize = min(5, 60) = 5, entries = 0...5 = 6
    XCTAssertEqual(result.entries.count, 6)
    let lastTimer = result.entries.last?.entries.first
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
