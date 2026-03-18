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

  // MARK: - TimelineBuilder: native timer (2-entry timeline)

  func testRunningTimerProducesTwoEntries() {
    let now = Date()
    let endDate = now.addingTimeInterval(30)
    let baseEntry = HomeWidgetEntry(
      date: now,
      entries: [makeTimer(remaining: 30, endDate: endDate, isPaused: false, isComplete: false)],
      updatedAt: now
    )
    let result = TimelineBuilder.buildTimeline(from: baseEntry)
    // Native Text(timerInterval:) handles countdown — only 2 entries: current + completion
    XCTAssertEqual(result.entries.count, 2)
    XCTAssertEqual(result.entries.first?.entries.first?.remainingSeconds, 30)
    XCTAssertEqual(result.entries.last?.entries.first?.remainingSeconds, 0)
    // Refresh after timer expires + 5s
    XCTAssertEqual(result.refreshDate.timeIntervalSince(endDate), 5, accuracy: 1.0)
  }

  func testLongTimerAlsoProducesTwoEntries() {
    let now = Date()
    let endDate = now.addingTimeInterval(3600) // 60 minutes
    let baseEntry = HomeWidgetEntry(
      date: now,
      entries: [makeTimer(remaining: 3600, endDate: endDate, isPaused: false, isComplete: false)],
      updatedAt: now
    )
    let result = TimelineBuilder.buildTimeline(from: baseEntry)
    // Same 2-entry timeline regardless of duration
    XCTAssertEqual(result.entries.count, 2)
    XCTAssertEqual(result.entries.first?.entries.first?.remainingSeconds, 3600)
    XCTAssertEqual(result.entries.last?.entries.first?.remainingSeconds, 0)
  }

  func testCompletionEntryMarksTimerComplete() {
    let now = Date()
    let endDate = now.addingTimeInterval(5)
    let baseEntry = HomeWidgetEntry(
      date: now,
      entries: [makeTimer(remaining: 5, endDate: endDate, isPaused: false, isComplete: false)],
      updatedAt: now
    )
    let result = TimelineBuilder.buildTimeline(from: baseEntry)
    XCTAssertEqual(result.entries.count, 2)
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
