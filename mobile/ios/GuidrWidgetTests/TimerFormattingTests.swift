import SwiftUI
import XCTest

class TimerFormattingTests: XCTestCase {

  // MARK: - formatTime

  func testFormatTimeZeroSeconds() {
    XCTAssertEqual(TimerFormatting.formatTime(0), "00:00")
  }

  func testFormatTimeSixtyOneSeconds() {
    XCTAssertEqual(TimerFormatting.formatTime(61), "01:01")
  }

  func testFormatTimeThirtyFiftyNineSeconds() {
    XCTAssertEqual(TimerFormatting.formatTime(3599), "59:59")
  }

  func testFormatTimeThirtySixHundredSeconds() {
    XCTAssertEqual(TimerFormatting.formatTime(3600), "60:00")
  }

  // MARK: - staticProgress

  func testStaticProgressZeroTotal() {
    XCTAssertEqual(TimerFormatting.staticProgress(remaining: 10, total: 0), 0.0)
  }

  func testStaticProgressHalfway() {
    XCTAssertEqual(TimerFormatting.staticProgress(remaining: 30, total: 60), 0.5, accuracy: 0.001)
  }

  func testStaticProgressComplete() {
    XCTAssertEqual(TimerFormatting.staticProgress(remaining: 0, total: 60), 1.0, accuracy: 0.001)
  }

  func testStaticProgressNegativeRemainingClampedToZero() {
    XCTAssertEqual(TimerFormatting.staticProgress(remaining: -5, total: 60), 1.0, accuracy: 0.001)
  }

  // MARK: - progressColor

  func testProgressColorMoreThanHalfIsGreen() {
    XCTAssertEqual(TimerFormatting.progressColor(remaining: 31, total: 60), .green)
  }

  func testProgressColorExactlyHalfIsYellow() {
    XCTAssertEqual(TimerFormatting.progressColor(remaining: 30, total: 60), .yellow)
  }

  func testProgressColorBetweenQuarterAndHalfIsYellow() {
    XCTAssertEqual(TimerFormatting.progressColor(remaining: 16, total: 60), .yellow)
  }

  func testProgressColorAtQuarterIsRed() {
    XCTAssertEqual(TimerFormatting.progressColor(remaining: 15, total: 60), .red)
  }

  func testProgressColorBelowQuarterIsRed() {
    XCTAssertEqual(TimerFormatting.progressColor(remaining: 5, total: 60), .red)
  }

  func testProgressColorZeroTotalIsGreen() {
    XCTAssertEqual(TimerFormatting.progressColor(remaining: 0, total: 0), .green)
  }
}
