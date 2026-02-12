import Foundation

struct SharedTimerEntry: Codable {
  let stepId: String
  let stepTitle: String
  let guideTitle: String
  let totalDurationSeconds: Int
  let endDate: Date?
  let remainingSeconds: Int
  let isPaused: Bool
  let isComplete: Bool
}

struct SharedTimerState: Codable {
  let entries: [SharedTimerEntry]
  let updatedAt: Date
}

class SharedTimerStorage {
  static let shared = SharedTimerStorage()

  private let suiteName = "group.com.guidr"
  private let storageKey = "timerState"

  private var defaults: UserDefaults? {
    UserDefaults(suiteName: suiteName)
  }

  private init() {}

  func save(_ entries: [SharedTimerEntry]) {
    let state = SharedTimerState(entries: entries, updatedAt: Date())
    guard let data = try? JSONEncoder().encode(state) else { return }
    defaults?.set(data, forKey: storageKey)
  }

  func load() -> SharedTimerState? {
    guard let data = defaults?.data(forKey: storageKey),
          let state = try? JSONDecoder().decode(SharedTimerState.self, from: data)
    else { return nil }
    return state
  }

  func clear() {
    defaults?.removeObject(forKey: storageKey)
  }
}
