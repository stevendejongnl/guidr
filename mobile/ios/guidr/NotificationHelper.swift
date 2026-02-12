import Foundation
import UserNotifications

class NotificationHelper {
  static let shared = NotificationHelper()

  private let prefsTimerKey = "Guidr_TimerNotificationsEnabled"
  private let prefsCriticalKey = "Guidr_CriticalNotificationsEnabled"

  private init() {}

  // MARK: - Preferences (read from UserDefaults, synced from JS)

  var timerNotificationsEnabled: Bool {
    // Default to true when key not present
    if UserDefaults.standard.object(forKey: prefsTimerKey) == nil {
      return true
    }
    return UserDefaults.standard.bool(forKey: prefsTimerKey)
  }

  var criticalNotificationsEnabled: Bool {
    return UserDefaults.standard.bool(forKey: prefsCriticalKey)
  }

  func syncPreferences(timerEnabled: Bool, criticalEnabled: Bool) {
    UserDefaults.standard.set(timerEnabled, forKey: prefsTimerKey)
    UserDefaults.standard.set(criticalEnabled, forKey: prefsCriticalKey)
  }

  // MARK: - Permission

  func requestPermission(completion: @escaping (Bool) -> Void) {
    let center = UNUserNotificationCenter.current()
    center.requestAuthorization(options: [.alert, .sound, .badge]) { granted, _ in
      completion(granted)
    }
  }

  // MARK: - Schedule / Cancel

  func scheduleTimerNotification(
    stepId: String,
    stepTitle: String,
    guideTitle: String,
    remainingSeconds: Int,
    critical: Bool
  ) {
    guard timerNotificationsEnabled else { return }
    guard remainingSeconds > 0 else { return }

    let content = UNMutableNotificationContent()
    content.title = "Timer Complete"
    content.body = "\(stepTitle) — \(guideTitle)"
    content.sound = .default

    if #available(iOS 15.0, *) {
      if critical && criticalNotificationsEnabled {
        content.interruptionLevel = .timeSensitive
      }
    }

    let trigger = UNTimeIntervalNotificationTrigger(
      timeInterval: TimeInterval(remainingSeconds),
      repeats: false
    )

    let identifier = "guidr-timer-\(stepId)"
    let request = UNNotificationRequest(identifier: identifier, content: content, trigger: trigger)

    UNUserNotificationCenter.current().add(request) { error in
      if let error = error {
        print("[NotificationHelper] Failed to schedule: \(error.localizedDescription)")
      }
    }
  }

  func cancelTimerNotification(stepId: String) {
    let identifier = "guidr-timer-\(stepId)"
    UNUserNotificationCenter.current().removePendingNotificationRequests(
      withIdentifiers: [identifier]
    )
  }

  func cancelAllTimerNotifications() {
    let center = UNUserNotificationCenter.current()
    center.getPendingNotificationRequests { requests in
      let timerIds = requests
        .map { $0.identifier }
        .filter { $0.hasPrefix("guidr-timer-") }
      if !timerIds.isEmpty {
        center.removePendingNotificationRequests(withIdentifiers: timerIds)
      }
    }
  }
}
