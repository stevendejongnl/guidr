import Foundation

/// Diagnostic logger accessible from the widget extension process.
/// Writes to the same App Group UserDefaults key as DiagnosticLogger in the main app.
class SharedDiagnosticLogger {
  static let shared = SharedDiagnosticLogger()
  private let suiteName = "group.com.guidr"
  private let storageKey = "diagnosticLog"
  private let maxEntries = 200
  private let defaults: UserDefaults?
  private let queue = DispatchQueue(label: "com.guidr.SharedDiagnosticLogger")

  private init() {
    defaults = UserDefaults(suiteName: suiteName)
  }

  private var appVersion: String {
    let version = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "?"
    let build = Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "?"
    return "v\(version)(\(build))"
  }

  func log(_ message: String) {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    let timestamp = formatter.string(from: Date())
    let entry = "[\(timestamp)] [\(appVersion)] \(message)"
    NSLog("[SharedDiagnosticLogger] %@", entry)

    // Use sync so the write completes before log() returns — the widget extension
    // process is short-lived and may be suspended immediately after rendering.
    // Without sync, async-queued writes are silently lost on process termination.
    queue.sync {
      var entries: [String]
      if let data = self.defaults?.data(forKey: self.storageKey),
         let decoded = try? JSONDecoder().decode([String].self, from: data) {
        entries = decoded
      } else {
        entries = []
      }
      entries.append(entry)
      if entries.count > self.maxEntries {
        entries = Array(entries.suffix(self.maxEntries))
      }
      if let data = try? JSONEncoder().encode(entries) {
        self.defaults?.set(data, forKey: self.storageKey)
      }
    }
  }

  func loadEntries() -> [String] {
    guard let data = defaults?.data(forKey: storageKey),
          let entries = try? JSONDecoder().decode([String].self, from: data)
    else { return [] }
    return entries
  }
}
