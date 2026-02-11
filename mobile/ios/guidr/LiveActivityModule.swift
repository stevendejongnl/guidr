import ActivityKit
import Foundation
import React

@objc(LiveActivityModule)
class LiveActivityModule: NSObject {

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }

  @objc
  func isAvailable(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    if #available(iOS 16.1, *) {
      resolve(ActivityAuthorizationInfo().areActivitiesEnabled)
    } else {
      resolve(false)
    }
  }

  @objc
  func startActivity(
    _ guideTitle: String,
    stepTitle: String,
    totalDurationSeconds: Int,
    remainingSeconds: Int,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    if #available(iOS 16.1, *) {
      let attributes = GuidrTimerAttributes(
        guideTitle: guideTitle,
        stepTitle: stepTitle,
        totalDurationSeconds: totalDurationSeconds
      )

      let endDate = Date().addingTimeInterval(TimeInterval(remainingSeconds))
      let state = GuidrTimerAttributes.ContentState(
        timerEndDate: endDate,
        remainingSeconds: remainingSeconds,
        isPaused: false,
        isComplete: false
      )

      do {
        // End any existing activity first
        for activity in Activity<GuidrTimerAttributes>.activities {
          Task {
            await activity.end(nil, dismissalPolicy: .immediate)
          }
        }

        let activity = try Activity.request(
          attributes: attributes,
          content: .init(state: state, staleDate: endDate),
          pushType: nil
        )
        resolve(activity.id)
      } catch {
        reject("START_FAILED", "Failed to start Live Activity: \(error.localizedDescription)", error)
      }
    } else {
      resolve(nil)
    }
  }

  @objc
  func updateActivity(
    _ remainingSeconds: Int,
    isPaused: Bool,
    isComplete: Bool,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    if #available(iOS 16.1, *) {
      let timerEndDate: Date? = (!isPaused && !isComplete)
        ? Date().addingTimeInterval(TimeInterval(remainingSeconds))
        : nil

      let state = GuidrTimerAttributes.ContentState(
        timerEndDate: timerEndDate,
        remainingSeconds: remainingSeconds,
        isPaused: isPaused,
        isComplete: isComplete
      )

      Task {
        for activity in Activity<GuidrTimerAttributes>.activities {
          await activity.update(.init(state: state, staleDate: nil))
        }
        resolve(nil)
      }
    } else {
      resolve(nil)
    }
  }

  @objc
  func endActivity(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    if #available(iOS 16.1, *) {
      Task {
        for activity in Activity<GuidrTimerAttributes>.activities {
          await activity.end(nil, dismissalPolicy: .immediate)
        }
        resolve(nil)
      }
    } else {
      resolve(nil)
    }
  }
}
