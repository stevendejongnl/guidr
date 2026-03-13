import Foundation
import XCTest

class HomeWidgetEntryTests: XCTestCase {

  // MARK: - hasTimers

  func testHasTimersEmptyIsFalse() {
    let entry = makeWidgetEntry(entries: [])
    XCTAssertFalse(entry.hasTimers)
  }

  func testHasTimersNonEmptyIsTrue() {
    let entry = makeWidgetEntry(entries: [makeTimer()])
    XCTAssertTrue(entry.hasTimers)
  }

  // MARK: - activeEntries

  func testActiveEntriesFiltersOutComplete() {
    let entries = [
      makeTimer(stepId: "s1", isComplete: false),
      makeTimer(stepId: "s2", isComplete: true),
      makeTimer(stepId: "s3", isComplete: false),
    ]
    let entry = makeWidgetEntry(entries: entries)
    XCTAssertEqual(entry.activeEntries.count, 2)
    XCTAssertEqual(entry.activeEntries.map(\.stepId), ["s1", "s3"])
  }

  // MARK: - activeCount

  func testActiveCountCorrect() {
    let entries = [
      makeTimer(isComplete: false),
      makeTimer(isComplete: true),
      makeTimer(isComplete: false),
    ]
    let entry = makeWidgetEntry(entries: entries)
    XCTAssertEqual(entry.activeCount, 2)
  }

  // MARK: - allComplete

  func testAllCompleteWhenAllDone() {
    let entries = [
      makeTimer(isComplete: true),
      makeTimer(isComplete: true),
    ]
    let entry = makeWidgetEntry(entries: entries)
    XCTAssertTrue(entry.allComplete)
  }

  func testAllCompleteIsFalseWhenSomeActive() {
    let entries = [
      makeTimer(isComplete: true),
      makeTimer(isComplete: false),
    ]
    let entry = makeWidgetEntry(entries: entries)
    XCTAssertFalse(entry.allComplete)
  }

  func testAllCompleteIsFalseWhenEmpty() {
    let entry = makeWidgetEntry(entries: [])
    XCTAssertFalse(entry.allComplete)
  }

  // MARK: - primaryEntry

  func testPrimaryEntryPicksSoonestRunning() {
    let now = Date()
    let entries = [
      makeTimer(stepId: "far", endDate: now.addingTimeInterval(100), isPaused: false, isComplete: false),
      makeTimer(stepId: "soon", endDate: now.addingTimeInterval(10), isPaused: false, isComplete: false),
      makeTimer(stepId: "mid", endDate: now.addingTimeInterval(50), isPaused: false, isComplete: false),
    ]
    let entry = makeWidgetEntry(entries: entries)
    XCTAssertEqual(entry.primaryEntry?.stepId, "soon")
  }

  func testPrimaryEntryFallsToPausedWhenNoRunning() {
    let entries = [
      makeTimer(stepId: "paused1", endDate: nil, isPaused: true, isComplete: false),
      makeTimer(stepId: "complete1", isComplete: true),
    ]
    let entry = makeWidgetEntry(entries: entries)
    XCTAssertEqual(entry.primaryEntry?.stepId, "paused1")
  }

  func testPrimaryEntryFallsToFirstWhenAllComplete() {
    let entries = [
      makeTimer(stepId: "c1", isComplete: true),
      makeTimer(stepId: "c2", isComplete: true),
    ]
    let entry = makeWidgetEntry(entries: entries)
    XCTAssertEqual(entry.primaryEntry?.stepId, "c1")
  }

  func testPrimaryEntryNilWhenEmpty() {
    let entry = makeWidgetEntry(entries: [])
    XCTAssertNil(entry.primaryEntry)
  }

  // MARK: - Helpers

  private func makeWidgetEntry(entries: [SharedTimerEntry]) -> HomeWidgetEntry {
    HomeWidgetEntry(date: Date(), entries: entries, updatedAt: Date())
  }

  private func makeTimer(
    stepId: String = UUID().uuidString,
    endDate: Date? = Date().addingTimeInterval(30),
    isPaused: Bool = false,
    isComplete: Bool = false
  ) -> SharedTimerEntry {
    SharedTimerEntry(
      stepId: stepId,
      stepTitle: "Step \(stepId)",
      guideTitle: "Guide",
      totalDurationSeconds: 60,
      endDate: isComplete ? nil : endDate,
      remainingSeconds: isComplete ? 0 : 30,
      isPaused: isPaused,
      isComplete: isComplete
    )
  }
}
