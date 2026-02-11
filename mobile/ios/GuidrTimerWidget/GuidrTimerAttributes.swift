import ActivityKit
import Foundation

struct GuidrTimerAttributes: ActivityAttributes {
  var guideTitle: String
  var stepTitle: String
  var totalDurationSeconds: Int

  struct ContentState: Codable, Hashable {
    var timerEndDate: Date?
    var remainingSeconds: Int
    var isPaused: Bool
    var isComplete: Bool
  }
}
