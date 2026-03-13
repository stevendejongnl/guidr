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

  private let defaults: UserDefaults?

  internal init(defaults: UserDefaults) {
    self.defaults = defaults
  }

  private init() {
    defaults = UserDefaults(suiteName: suiteName)
    if defaults == nil {
      NSLog("[GuidrStorage] CRITICAL: UserDefaults(suiteName: %@) returned nil — App Group misconfigured", suiteName)
    }
  }

  func save(_ entries: [SharedTimerEntry]) {
    let state = SharedTimerState(entries: entries, updatedAt: Date())
    guard let data = try? JSONEncoder().encode(state) else {
      NSLog("[GuidrStorage] save: encoding failed for %d entries", entries.count)
      return
    }
    defaults?.set(data, forKey: storageKey)
    NSLog("[GuidrStorage] save: wrote %d entries (%d bytes)", entries.count, data.count)

    // Read-back verification
    if let readBack = defaults?.data(forKey: storageKey) {
      NSLog("[GuidrStorage] save: read-back OK (%d bytes)", readBack.count)
    } else {
      NSLog("[GuidrStorage] save: read-back FAILED — data not persisted")
    }
  }

  func load() -> SharedTimerState? {
    guard let data = defaults?.data(forKey: storageKey),
          let state = try? JSONDecoder().decode(SharedTimerState.self, from: data)
    else {
      NSLog("[GuidrStorage] load: no data or decode failed")
      return nil
    }
    NSLog("[GuidrStorage] load: read %d entries (%d bytes), updatedAt=%@",
          state.entries.count, data.count, String(describing: state.updatedAt))
    return state
  }

  func clear() {
    defaults?.removeObject(forKey: storageKey)
    NSLog("[GuidrStorage] clear: removed stored state")
  }
}
