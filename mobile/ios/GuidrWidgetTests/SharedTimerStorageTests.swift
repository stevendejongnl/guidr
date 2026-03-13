import Foundation
import XCTest

class SharedTimerStorageTests: XCTestCase {
  private var defaults: UserDefaults!
  private var storage: SharedTimerStorage!

  override func setUp() {
    super.setUp()
    defaults = UserDefaults(suiteName: "com.guidr.test.\(UUID().uuidString)")!
    storage = SharedTimerStorage(defaults: defaults)
  }

  override func tearDown() {
    defaults.removePersistentDomain(forName: defaults.volatileDomainNames.first ?? "")
    super.tearDown()
  }

  // MARK: - Round-trip

  func testSaveAndLoadRoundTrip() {
    let entries = [makeEntry(stepId: "s1", remaining: 30)]
    storage.save(entries)

    let loaded = storage.load()
    XCTAssertNotNil(loaded)
    XCTAssertEqual(loaded?.entries.count, 1)
    XCTAssertEqual(loaded?.entries.first?.stepId, "s1")
    XCTAssertEqual(loaded?.entries.first?.remainingSeconds, 30)
  }

  func testLoadWithNoDataReturnsNil() {
    XCTAssertNil(storage.load())
  }

  func testClearRemovesData() {
    storage.save([makeEntry(stepId: "s1")])
    XCTAssertNotNil(storage.load())

    storage.clear()
    XCTAssertNil(storage.load())
  }

  // MARK: - Encoding edge cases

  func testEncodeDecodeWithNilEndDate() {
    let entry = makeEntry(stepId: "s1", endDate: nil)
    storage.save([entry])

    let loaded = storage.load()
    XCTAssertNotNil(loaded)
    XCTAssertNil(loaded?.entries.first?.endDate)
  }

  func testEncodeDecodeWithNonNilEndDate() {
    let date = Date(timeIntervalSince1970: 1700000000)
    let entry = makeEntry(stepId: "s1", endDate: date)
    storage.save([entry])

    let loaded = storage.load()
    XCTAssertNotNil(loaded)
    XCTAssertEqual(loaded?.entries.first?.endDate?.timeIntervalSince1970 ?? 0, 1700000000, accuracy: 1.0)
  }

  func testMultipleEntries() {
    let entries = [
      makeEntry(stepId: "s1", remaining: 10),
      makeEntry(stepId: "s2", remaining: 20),
      makeEntry(stepId: "s3", remaining: 30),
    ]
    storage.save(entries)

    let loaded = storage.load()
    XCTAssertEqual(loaded?.entries.count, 3)
    XCTAssertEqual(loaded?.entries.map(\.stepId), ["s1", "s2", "s3"])
  }

  func testSaveOverwritesPreviousData() {
    storage.save([makeEntry(stepId: "s1")])
    storage.save([makeEntry(stepId: "s2")])

    let loaded = storage.load()
    XCTAssertEqual(loaded?.entries.count, 1)
    XCTAssertEqual(loaded?.entries.first?.stepId, "s2")
  }

  // MARK: - Helpers

  private func makeEntry(
    stepId: String = "step",
    stepTitle: String = "Test Step",
    guideTitle: String = "Test Guide",
    totalDuration: Int = 60,
    endDate: Date? = Date().addingTimeInterval(30),
    remaining: Int = 30,
    isPaused: Bool = false,
    isComplete: Bool = false
  ) -> SharedTimerEntry {
    SharedTimerEntry(
      stepId: stepId,
      stepTitle: stepTitle,
      guideTitle: guideTitle,
      totalDurationSeconds: totalDuration,
      endDate: endDate,
      remainingSeconds: remaining,
      isPaused: isPaused,
      isComplete: isComplete
    )
  }
}
