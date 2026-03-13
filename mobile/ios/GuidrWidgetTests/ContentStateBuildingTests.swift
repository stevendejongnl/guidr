import Foundation
import XCTest

class ContentStateBuildingTests: XCTestCase {

  func testSingleRunningTimer() {
    let now = Date()
    let entries = [
      makeEntry(stepId: "s1", stepTitle: "Boil water", remaining: 45, endDate: now.addingTimeInterval(45)),
    ]
    let state = ContentStateBuilder.build(from: entries)
    XCTAssertEqual(state.stepTitle, "Boil water")
    XCTAssertEqual(state.remainingSeconds, 45)
    XCTAssertEqual(state.totalDurationSeconds, 60)
    XCTAssertFalse(state.isComplete)
    XCTAssertFalse(state.isPaused)
    XCTAssertEqual(state.activeTimerCount, 1)
  }

  func testMultipleTimersPicksSoonest() {
    let now = Date()
    let entries = [
      makeEntry(stepId: "s1", stepTitle: "Far", remaining: 120, endDate: now.addingTimeInterval(120)),
      makeEntry(stepId: "s2", stepTitle: "Soon", remaining: 10, endDate: now.addingTimeInterval(10)),
    ]
    let state = ContentStateBuilder.build(from: entries)
    XCTAssertEqual(state.stepTitle, "Soon")
    XCTAssertEqual(state.remainingSeconds, 10)
    XCTAssertEqual(state.activeTimerCount, 2)
  }

  func testAllCompleteShowsAllDone() {
    let entries = [
      makeEntry(stepId: "s1", remaining: 0, endDate: nil, isComplete: true),
      makeEntry(stepId: "s2", remaining: 0, endDate: nil, isComplete: true),
    ]
    let state = ContentStateBuilder.build(from: entries)
    XCTAssertTrue(state.isComplete)
    XCTAssertEqual(state.stepTitle, "All done!")
    XCTAssertEqual(state.activeTimerCount, 0)
  }

  func testMixedPausedAndRunning() {
    let now = Date()
    let entries = [
      makeEntry(stepId: "paused", stepTitle: "Paused Step", remaining: 30, endDate: nil, isPaused: true),
      makeEntry(stepId: "running", stepTitle: "Running Step", remaining: 20, endDate: now.addingTimeInterval(20)),
    ]
    let state = ContentStateBuilder.build(from: entries)
    XCTAssertEqual(state.stepTitle, "Running Step")
    XCTAssertFalse(state.isPaused)
    XCTAssertEqual(state.activeTimerCount, 2)
  }

  func testOnlyPausedTimerShowsPaused() {
    let entries = [
      makeEntry(stepId: "s1", stepTitle: "Paused", remaining: 30, endDate: nil, isPaused: true),
    ]
    let state = ContentStateBuilder.build(from: entries)
    XCTAssertEqual(state.stepTitle, "Paused")
    XCTAssertTrue(state.isPaused)
    XCTAssertEqual(state.activeTimerCount, 1)
  }

  func testEmptyEntriesReturnsDefaults() {
    let state = ContentStateBuilder.build(from: [])
    XCTAssertEqual(state.stepTitle, "")
    XCTAssertEqual(state.remainingSeconds, 0)
    XCTAssertFalse(state.isComplete)
    XCTAssertEqual(state.activeTimerCount, 0)
  }

  func testCompleteAndRunningMixed() {
    let now = Date()
    let entries = [
      makeEntry(stepId: "done", remaining: 0, endDate: nil, isComplete: true),
      makeEntry(stepId: "active", stepTitle: "Active Step", remaining: 50, endDate: now.addingTimeInterval(50)),
    ]
    let state = ContentStateBuilder.build(from: entries)
    XCTAssertFalse(state.isComplete)
    XCTAssertEqual(state.stepTitle, "Active Step")
    XCTAssertEqual(state.activeTimerCount, 1)
  }

  func testTimerEndDateMatchesPrimary() {
    let now = Date()
    let endDate = now.addingTimeInterval(25)
    let entries = [
      makeEntry(stepId: "s1", remaining: 25, endDate: endDate),
    ]
    let state = ContentStateBuilder.build(from: entries)
    XCTAssertEqual(state.timerEndDate, endDate)
  }

  // MARK: - Helpers

  private func makeEntry(
    stepId: String = "step",
    stepTitle: String = "Test Step",
    remaining: Int = 30,
    totalDuration: Int = 60,
    endDate: Date? = Date().addingTimeInterval(30),
    isPaused: Bool = false,
    isComplete: Bool = false
  ) -> SharedTimerEntry {
    SharedTimerEntry(
      stepId: stepId,
      stepTitle: stepTitle,
      guideTitle: "Test Guide",
      totalDurationSeconds: totalDuration,
      endDate: endDate,
      remainingSeconds: remaining,
      isPaused: isPaused,
      isComplete: isComplete
    )
  }
}
