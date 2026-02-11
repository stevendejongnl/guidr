import ActivityKit
import Foundation

struct GuidrTimerAttributes: ActivityAttributes {
  var guideTitle: String

  struct ContentState: Codable, Hashable {
    var stepTitle: String
    var totalDurationSeconds: Int
    var timerEndDate: Date?
    var remainingSeconds: Int
    var isPaused: Bool
    var isComplete: Bool
    var activeTimerCount: Int
  }
}
