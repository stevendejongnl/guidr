import Foundation

/// Diagnostic logger accessible from the widget extension process.
/// Writes to the same App Group UserDefaults key as DiagnosticLogger in the main app.
class SharedDiagnosticLogger {
  static let shared = SharedDiagnosticLogger()
  private let suiteName = "group.com.guidr"
  private let storageKey = "diagnosticLog"
  private let maxEntries = 200
  private let defaults: UserDefaults?

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

    var entries = loadEntries()
    entries.append(entry)
    if entries.count > maxEntries {
      entries = Array(entries.suffix(maxEntries))
    }
    if let data = try? JSONEncoder().encode(entries) {
      defaults?.set(data, forKey: storageKey)
      defaults?.synchronize()
    }
  }

  func loadEntries() -> [String] {
    guard let data = defaults?.data(forKey: storageKey),
          let entries = try? JSONDecoder().decode([String].self, from: data)
    else { return [] }
    return entries
  }
}
