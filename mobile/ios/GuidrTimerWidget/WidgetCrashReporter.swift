import Foundation
import MetricKit

// Reports widget extension crashes to the shared App Group UserDefaults so
// AdminScreen (main app) can surface them alongside main-process crash logs.
// MetricKit delivers diagnostics on the next extension launch after a crash.
class WidgetCrashReporter: NSObject, MXMetricManagerSubscriber {
  static let shared = WidgetCrashReporter()
  private let defaults = UserDefaults(suiteName: "group.com.guidr")
  private let storageKey = "crashLog"
  private let maxEntries = 50

  func subscribe() {
    MXMetricManager.shared.add(self)
  }

  func didReceive(_ payloads: [MXDiagnosticPayload]) {
    for payload in payloads {
      guard let crashes = payload.crashDiagnostics else { continue }
      for crash in crashes {
        appendEntry(formatEntry(crash, at: payload.timeStampEnd))
      }
    }
  }

  // Required by MXMetricManagerSubscriber but not used
  func didReceive(_ payloads: [MXMetricPayload]) {}

  // MARK: - Private

  private func appendEntry(_ entry: String) {
    var entries = loadEntries()
    entries.append(entry)
    if entries.count > maxEntries {
      entries = Array(entries.suffix(maxEntries))
    }
    if let data = try? JSONEncoder().encode(entries) {
      defaults?.set(data, forKey: storageKey)
    }
  }

  private func loadEntries() -> [String] {
    guard let data = defaults?.data(forKey: storageKey),
          let entries = try? JSONDecoder().decode([String].self, from: data)
    else { return [] }
    return entries
  }

  private func formatEntry(_ crash: MXCrashDiagnostic, at date: Date) -> String {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    let timestamp = formatter.string(from: date)

    var lines: [String] = ["[\(timestamp)] === WIDGET CRASH ==="]

    if let reason = crash.terminationReason {
      lines.append("Reason: \(reason)")
    }
    if let exType = crash.exceptionType {
      lines.append("ExceptionType: \(exType)")
    }
    if let exCode = crash.exceptionCode {
      lines.append("ExceptionCode: \(exCode)")
    }
    if let sig = crash.signal {
      lines.append("Signal: \(sig)")
    }
    if let region = crash.virtualMemoryRegionInfo {
      lines.append("MemRegion: \(region)")
    }

    let stackData = crash.callStackTree.jsonRepresentation()
    if let json = try? JSONSerialization.jsonObject(with: stackData) as? [String: Any],
       let stacks = json["callStacks"] as? [[String: Any]] {
      let crashThread = stacks.first(where: { $0["threadAttributed"] as? Bool == true }) ?? stacks.first
      if let roots = crashThread?["callStackRootFrames"] as? [[String: Any]] {
        var frames: [String] = []
        collectFrames(roots, into: &frames, limit: 20)
        if !frames.isEmpty {
          lines.append("Stack:")
          lines.append(contentsOf: frames)
        }
      }
    }

    lines.append("==================")
    return lines.joined(separator: "\n")
  }

  private func collectFrames(_ nodes: [[String: Any]], into frames: inout [String], limit: Int) {
    guard frames.count < limit else { return }
    for node in nodes {
      guard frames.count < limit else { return }
      let binary = node["binaryName"] as? String ?? "?"
      let offset = node["offsetIntoBinaryTextSegment"] as? Int ?? 0
      frames.append("  \(binary) + \(offset)")
      if let sub = node["subFrames"] as? [[String: Any]] {
        collectFrames(sub, into: &frames, limit: limit)
      }
    }
  }
}
