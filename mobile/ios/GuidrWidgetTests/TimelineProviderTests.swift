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

  func testShortTimerPerSecondOnly() {
    let now = Date()
    let endDate = now.addingTimeInterval(30)
    let baseEntry = HomeWidgetEntry(
      date: now,
      entries: [makeTimer(remaining: 30, endDate: endDate, isPaused: false, isComplete: false)],
      updatedAt: now
    )
    let result = TimelineBuilder.buildTimeline(from: baseEntry)
    // 30s timer: all per-second, entries = 0...30 = 31
    XCTAssertEqual(result.entries.count, 31)
    XCTAssertEqual(result.entries.first?.entries.first?.remainingSeconds, 30)
    XCTAssertEqual(result.entries.last?.entries.first?.remainingSeconds, 0)
    // Refresh after timer expires + 5s
    XCTAssertEqual(result.refreshDate.timeIntervalSince(endDate), 5, accuracy: 1.0)
  }

  func testMediumTimerPerSecondOnly() {
    let now = Date()
    let endDate = now.addingTimeInterval(120)
    let baseEntry = HomeWidgetEntry(
      date: now,
      entries: [makeTimer(remaining: 120, endDate: endDate, isPaused: false, isComplete: false)],
      updatedAt: now
    )
    let result = TimelineBuilder.buildTimeline(from: baseEntry)
    // 120s timer: all per-second (≤120), entries = 0...120 = 121
    XCTAssertEqual(result.entries.count, 121)
    XCTAssertEqual(result.entries.first?.entries.first?.remainingSeconds, 120)
    XCTAssertEqual(result.entries.last?.entries.first?.remainingSeconds, 0)
    XCTAssertEqual(result.refreshDate.timeIntervalSince(endDate), 5, accuracy: 1.0)
  }

  func testLongTimerMultiGranularity() {
    let now = Date()
    let endDate = now.addingTimeInterval(300) // 5 minutes
    let baseEntry = HomeWidgetEntry(
      date: now,
      entries: [makeTimer(remaining: 300, endDate: endDate, isPaused: false, isComplete: false)],
      updatedAt: now
    )
    let result = TimelineBuilder.buildTimeline(from: baseEntry)
    // Phase 1: per-second for 0..120 = 121 entries
    // Phase 2: per-minute for remaining 180s = 3 entries (at 180, 240, 300)
    XCTAssertEqual(result.entries.count, 124)
    XCTAssertEqual(result.entries.first?.entries.first?.remainingSeconds, 300)
    XCTAssertEqual(result.entries.last?.entries.first?.remainingSeconds, 0)
    XCTAssertEqual(result.refreshDate.timeIntervalSince(endDate), 5, accuracy: 1.0)
  }

  func testVeryLongTimerMultiGranularity() {
    let now = Date()
    let endDate = now.addingTimeInterval(3600) // 60 minutes
    let baseEntry = HomeWidgetEntry(
      date: now,
      entries: [makeTimer(remaining: 3600, endDate: endDate, isPaused: false, isComplete: false)],
      updatedAt: now
    )
    let result = TimelineBuilder.buildTimeline(from: baseEntry)
    // Phase 1: per-second for 0..120 = 121 entries
    // Phase 2: per-minute for remaining 3480s = ceil(3480/60) = 58 entries
    XCTAssertEqual(result.entries.count, 179)
    XCTAssertEqual(result.entries.first?.entries.first?.remainingSeconds, 3600)
    // Last entry should be at or near 0
    XCTAssertTrue(result.entries.last!.entries.first!.remainingSeconds <= 0)
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
