import Foundation
import React

@objc(NotificationModule)
class NotificationModule: NSObject {

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }

  @objc
  func requestPermission(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    NotificationHelper.shared.requestPermission { granted in
      resolve(granted)
    }
  }

  @objc
  func scheduleNotification(
    _ stepId: String,
    stepTitle: String,
    guideTitle: String,
    remainingSeconds: Int,
    critical: Bool,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    NotificationHelper.shared.scheduleTimerNotification(
      stepId: stepId,
      stepTitle: stepTitle,
      guideTitle: guideTitle,
      remainingSeconds: remainingSeconds,
      critical: critical
    )
    resolve(nil)
  }

  @objc
  func cancelNotification(
    _ stepId: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    NotificationHelper.shared.cancelTimerNotification(stepId: stepId)
    resolve(nil)
  }

  @objc
  func cancelAllNotifications(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    NotificationHelper.shared.cancelAllTimerNotifications()
    resolve(nil)
  }

  @objc
  func showNotification(
    _ stepId: String,
    stepTitle: String,
    guideTitle: String,
    critical: Bool,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    // On iOS, showNotification is a no-op (we use scheduled notifications)
    resolve(nil)
  }

  @objc
  func syncPreferences(
    _ timerEnabled: Bool,
    criticalEnabled: Bool,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    NotificationHelper.shared.syncPreferences(
      timerEnabled: timerEnabled,
      criticalEnabled: criticalEnabled
    )
    resolve(nil)
  }
}
