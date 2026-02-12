import ActivityKit
import Foundation
import React
import WidgetKit

@objc(LiveActivityModule)
class LiveActivityModule: NSObject {

  private struct TimerEntry {
    let stepId: String
    var stepTitle: String
    var guideTitle: String
    var totalDurationSeconds: Int
    var endDate: Date?
    var remainingSeconds: Int
    var isPaused: Bool
    var isComplete: Bool
  }

  private var timerEntries: [TimerEntry] = []
  private var completionWorkItem: DispatchWorkItem?
  private var reloadWorkItem: DispatchWorkItem?

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }

  @objc
  func isAvailable(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    if #available(iOS 16.2, *) {
      resolve(ActivityAuthorizationInfo().areActivitiesEnabled)
    } else {
      resolve(false)
    }
  }

  @objc
  func startActivity(
    _ stepId: String,
    guideTitle: String,
    stepTitle: String,
    totalDurationSeconds: Int,
    remainingSeconds: Int,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    if #available(iOS 16.2, *) {
      NSLog("[LiveActivity] startActivity called - stepId: %@, remaining: %d", stepId, remainingSeconds)
      NSLog("[LiveActivity] areActivitiesEnabled: %@", ActivityAuthorizationInfo().areActivitiesEnabled ? "true" : "false")

      guard ActivityAuthorizationInfo().areActivitiesEnabled else {
        reject("ACTIVITIES_DISABLED", "Live Activities are disabled. Enable in Settings > Guidr.", nil)
        return
      }

      let endDate = Date().addingTimeInterval(TimeInterval(remainingSeconds))

      // Update existing entry or append new one
      if let index = timerEntries.firstIndex(where: { $0.stepId == stepId }) {
        timerEntries[index].stepTitle = stepTitle
        timerEntries[index].guideTitle = guideTitle
        timerEntries[index].totalDurationSeconds = totalDurationSeconds
        timerEntries[index].endDate = endDate
        timerEntries[index].remainingSeconds = remainingSeconds
        timerEntries[index].isPaused = false
        timerEntries[index].isComplete = false
      } else {
        timerEntries.append(TimerEntry(
          stepId: stepId,
          stepTitle: stepTitle,
          guideTitle: guideTitle,
          totalDurationSeconds: totalDurationSeconds,
          endDate: endDate,
          remainingSeconds: remainingSeconds,
          isPaused: false,
          isComplete: false
        ))
      }

      let state = buildContentState()
      let soonestEndDate = soonestRunningEndDate()

      // Clean up lingering ended/dismissed activities to free iOS per-app slots
      let allActivities = Activity<GuidrTimerAttributes>.activities
      NSLog("[LiveActivity] existing activities: %d", allActivities.count)
      for act in allActivities {
        NSLog("[LiveActivity]   id=%@ state=%@", act.id, String(describing: act.activityState))
        if act.activityState != .active {
          Task { await act.end(nil, dismissalPolicy: .immediate) }
        }
      }

      // Check if an active Live Activity already exists
      let existingActivity = allActivities.first { $0.activityState == .active }
      if let activity = existingActivity {
        Task {
          await activity.update(.init(state: state, staleDate: soonestEndDate))
          NSLog("[LiveActivity] updated existing activity: %@", activity.id)
          resolve(activity.id)
        }
      } else {
        do {
          let attributes = GuidrTimerAttributes(guideTitle: guideTitle)
          let activity = try Activity.request(
            attributes: attributes,
            content: .init(state: state, staleDate: soonestEndDate),
            pushType: nil
          )
          NSLog("[LiveActivity] created new activity: %@", activity.id)
          resolve(activity.id)
        } catch {
          NSLog("[LiveActivity] failed to create activity: %@", error.localizedDescription)
          reject("START_FAILED", "Failed to start Live Activity: \(error.localizedDescription)", error)
          return
        }
      }

      scheduleCompletionForSoonest()
      saveWidgetState()
      reloadWidget()

      // Schedule notification for timer completion
      NotificationHelper.shared.scheduleTimerNotification(
        stepId: stepId,
        stepTitle: stepTitle,
        guideTitle: guideTitle,
        remainingSeconds: remainingSeconds,
        critical: NotificationHelper.shared.criticalNotificationsEnabled
      )
    } else {
      resolve(nil)
    }
  }

  @objc
  func updateActivity(
    _ stepId: String,
    remainingSeconds: Int,
    isPaused: Bool,
    isComplete: Bool,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    if #available(iOS 16.2, *) {
      guard let index = timerEntries.firstIndex(where: { $0.stepId == stepId }) else {
        resolve(nil)
        return
      }

      timerEntries[index].remainingSeconds = remainingSeconds
      timerEntries[index].isPaused = isPaused
      timerEntries[index].isComplete = isComplete

      if isPaused {
        timerEntries[index].endDate = nil
        NotificationHelper.shared.cancelTimerNotification(stepId: stepId)
      } else if isComplete {
        timerEntries[index].endDate = nil
        // Don't cancel — notification fires at scheduled completion time
      } else {
        timerEntries[index].endDate = Date().addingTimeInterval(TimeInterval(remainingSeconds))
        // Reschedule notification on resume
        let entry = timerEntries[index]
        NotificationHelper.shared.scheduleTimerNotification(
          stepId: stepId,
          stepTitle: entry.stepTitle,
          guideTitle: entry.guideTitle,
          remainingSeconds: remainingSeconds,
          critical: NotificationHelper.shared.criticalNotificationsEnabled
        )
      }

      let state = buildContentState()
      let soonestEndDate = soonestRunningEndDate()

      Task {
        for activity in Activity<GuidrTimerAttributes>.activities {
          await activity.update(.init(state: state, staleDate: soonestEndDate))
        }
        resolve(nil)
      }

      scheduleCompletionForSoonest()
      saveWidgetState()
      reloadWidget()
    } else {
      resolve(nil)
    }
  }

  @objc
  func removeTimer(
    _ stepId: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    if #available(iOS 16.2, *) {
      timerEntries.removeAll { $0.stepId == stepId }
      NotificationHelper.shared.cancelTimerNotification(stepId: stepId)

      if timerEntries.isEmpty {
        completionWorkItem?.cancel()
        completionWorkItem = nil
        SharedTimerStorage.shared.clear()
        WidgetCenter.shared.reloadTimelines(ofKind: "GuidrHomeWidget")
        Task {
          for activity in Activity<GuidrTimerAttributes>.activities {
            await activity.end(nil, dismissalPolicy: .immediate)
          }
          resolve(nil)
        }
      } else {
        let state = buildContentState()
        let soonestEndDate = soonestRunningEndDate()
        Task {
          for activity in Activity<GuidrTimerAttributes>.activities {
            await activity.update(.init(state: state, staleDate: soonestEndDate))
          }
          resolve(nil)
        }
        scheduleCompletionForSoonest()
        saveWidgetState()
        reloadWidget()
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
    if #available(iOS 16.2, *) {
      completionWorkItem?.cancel()
      completionWorkItem = nil
      timerEntries.removeAll()
      NotificationHelper.shared.cancelAllTimerNotifications()
      SharedTimerStorage.shared.clear()
      WidgetCenter.shared.reloadTimelines(ofKind: "GuidrHomeWidget")

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

  // MARK: - Private helpers

  @available(iOS 16.2, *)
  private func buildContentState() -> GuidrTimerAttributes.ContentState {
    let active = timerEntries.filter { !$0.isComplete }
    let running = active.filter { !$0.isPaused && $0.endDate != nil }

    // Pick soonest running timer, or first paused, or first complete
    let primary = running.min(by: { ($0.endDate ?? .distantFuture) < ($1.endDate ?? .distantFuture) })
      ?? active.first
      ?? timerEntries.first

    let allDone = active.isEmpty && !timerEntries.isEmpty

    return GuidrTimerAttributes.ContentState(
      stepTitle: allDone ? "All done!" : (primary?.stepTitle ?? ""),
      totalDurationSeconds: primary?.totalDurationSeconds ?? 0,
      timerEndDate: primary?.endDate,
      remainingSeconds: primary?.remainingSeconds ?? 0,
      isPaused: primary?.isPaused ?? false,
      isComplete: allDone,
      activeTimerCount: active.count
    )
  }

  private func soonestRunningEndDate() -> Date? {
    return timerEntries
      .filter { !$0.isPaused && !$0.isComplete && $0.endDate != nil }
      .compactMap { $0.endDate }
      .min()
  }

  @available(iOS 16.2, *)
  private func scheduleCompletionForSoonest() {
    completionWorkItem?.cancel()

    guard let soonestDate = soonestRunningEndDate() else { return }

    let delay = max(0.5, soonestDate.timeIntervalSinceNow + 0.5)
    let workItem = DispatchWorkItem { [weak self] in
      guard let self = self else { return }
      self.handleTimerCompletion()
    }
    completionWorkItem = workItem
    DispatchQueue.main.asyncAfter(deadline: .now() + delay, execute: workItem)
  }

  @available(iOS 16.2, *)
  private func handleTimerCompletion() {
    let now = Date()

    // Mark expired timers as complete
    for i in 0..<timerEntries.count {
      if let endDate = timerEntries[i].endDate, endDate <= now, !timerEntries[i].isPaused {
        timerEntries[i].isComplete = true
        timerEntries[i].endDate = nil
        timerEntries[i].remainingSeconds = 0
      }
    }

    let state = buildContentState()
    let soonestEndDate = soonestRunningEndDate()
    let allDone = timerEntries.filter({ !$0.isComplete }).isEmpty && !timerEntries.isEmpty

    saveWidgetState()
    reloadWidget()

    Task {
      for activity in Activity<GuidrTimerAttributes>.activities {
        await activity.update(.init(state: state, staleDate: soonestEndDate))
      }

      if allDone {
        // Dismiss after 3 seconds
        try? await Task.sleep(nanoseconds: 3_000_000_000)
        for activity in Activity<GuidrTimerAttributes>.activities {
          await activity.end(nil, dismissalPolicy: .immediate)
        }
        await MainActor.run {
          self.timerEntries.removeAll()
          SharedTimerStorage.shared.clear()
          WidgetCenter.shared.reloadTimelines(ofKind: "GuidrHomeWidget")
        }
      }
    }

    // Schedule next completion if more running timers remain
    if !allDone {
      scheduleCompletionForSoonest()
    }
  }

  private func saveWidgetState() {
    let shared = timerEntries.map { entry in
      SharedTimerEntry(
        stepId: entry.stepId,
        stepTitle: entry.stepTitle,
        guideTitle: entry.guideTitle,
        totalDurationSeconds: entry.totalDurationSeconds,
        endDate: entry.endDate,
        remainingSeconds: entry.remainingSeconds,
        isPaused: entry.isPaused,
        isComplete: entry.isComplete
      )
    }
    SharedTimerStorage.shared.save(shared)
  }

  private func reloadWidget() {
    reloadWorkItem?.cancel()
    let workItem = DispatchWorkItem {
      WidgetCenter.shared.reloadTimelines(ofKind: "GuidrHomeWidget")
    }
    reloadWorkItem = workItem
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5, execute: workItem)
  }
}
