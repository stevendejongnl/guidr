import ActivityKit
import SwiftUI
import WidgetKit

@available(iOS 16.1, *)
struct GuidrTimerWidgetLiveActivity: Widget {
  var body: some WidgetConfiguration {
    let _ = SharedDiagnosticLogger.shared.log("[LiveActivityWidget] ActivityConfiguration body evaluated")
    return ActivityConfiguration(for: GuidrTimerAttributes.self) { context in
      let _ = SharedDiagnosticLogger.shared.log("[LiveActivityWidget] lock screen closure called — stepTitle=\(context.state.stepTitle)")
      return LockScreenView(context: context)
        .padding()
        .activityBackgroundTint(Color.black.opacity(0.85))
        .activitySystemActionForegroundColor(Color.white)
    } dynamicIsland: { context in
      let _ = SharedDiagnosticLogger.shared.log("[LiveActivityWidget] dynamicIsland closure called")
      return DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          Label(context.state.stepTitle, systemImage: "timer")
            .font(.caption)
            .widgetPrimaryText()
        }
        DynamicIslandExpandedRegion(.trailing) {
          TimerText(state: context.state)
        }
        DynamicIslandExpandedRegion(.bottom) {
          TimerProgressView(state: context.state)
        }
      } compactLeading: {
        Image(systemName: "timer")
          .foregroundColor(compactColor(state: context.state))
      } compactTrailing: {
        TimerText(state: context.state)
          .font(.caption)
      } minimal: {
        Image(systemName: "timer")
          .foregroundColor(compactColor(state: context.state))
      }
    }
  }
}

@available(iOS 16.1, *)
private struct GuidrDotsView: View {
  var body: some View {
    HStack(spacing: 1.5) {
      Circle()
        .fill(Color.green.opacity(0.4))
        .frame(width: 3, height: 3)
        .offset(y: 2)
      Circle()
        .fill(Color.green.opacity(0.65))
        .frame(width: 4, height: 4)
      Circle()
        .fill(Color.green.opacity(0.9))
        .frame(width: 5, height: 5)
        .offset(y: -2)
    }
    .frame(height: 9)
    .widgetAccentable()
  }
}

@available(iOS 16.1, *)
private struct LockScreenView: View {
  let context: ActivityViewContext<GuidrTimerAttributes>

  init(context: ActivityViewContext<GuidrTimerAttributes>) {
    self.context = context
    SharedDiagnosticLogger.shared.log("[LiveActivityWidget] LockScreenView rendered stepTitle=\(context.state.stepTitle) remaining=\(context.state.remainingSeconds)")
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      HStack(spacing: 4) {
        GuidrDotsView()
        Text("Guidr")
          .font(.caption2)
          .widgetTertiaryText()
          .textCase(.uppercase)
      }

      HStack {
        Text(context.attributes.guideTitle)
          .font(.headline)
          .widgetPrimaryText()
          .lineLimit(1)
        Spacer(minLength: 8)
        TimerText(state: context.state)
          .font(.title2.monospacedDigit())
          .foregroundColor(timerTextColor)
          .widgetAccentable()
          .fixedSize(horizontal: true, vertical: false)
      }

      Text(context.state.stepTitle)
        .font(.subheadline)
        .widgetSecondaryText()
        .lineLimit(1)

      if context.state.activeTimerCount > 1 {
        Text("+\(context.state.activeTimerCount - 1) more timer\(context.state.activeTimerCount > 2 ? "s" : "")")
          .font(.caption2)
          .widgetTertiaryText()
      }

      TimerProgressView(state: context.state)
    }
  }

  private var timerTextColor: Color {
    if context.state.isComplete {
      return .green
    }
    if context.state.isPaused {
      return .orange
    }
    return progressColor(state: context.state)
  }
}

@available(iOS 16.1, *)
private struct TimerText: View {
  let state: GuidrTimerAttributes.ContentState

  var body: some View {
    if state.isComplete {
      Text("Done")
        .foregroundColor(.green)
        .fontWeight(.semibold)
    } else if state.isPaused {
      Text(formatTime(state.remainingSeconds))
        .foregroundColor(.orange)
    } else if let endDate = state.timerEndDate, let safe = safeEndDate(endDate) {
      Text(timerInterval: Date.now...safe, countsDown: true)
        .foregroundColor(progressColor(state: state))
        .monospacedDigit()
    } else if state.timerEndDate != nil {
      Text("Done")
        .foregroundColor(.green)
        .fontWeight(.semibold)
    } else {
      Text(formatTime(state.remainingSeconds))
        .widgetPrimaryText()
    }
  }
}

@available(iOS 16.1, *)
private struct TimerProgressView: View {
  let state: GuidrTimerAttributes.ContentState

  var body: some View {
    if state.isComplete {
      ProgressView(value: 1.0, total: 1.0)
        .tint(.green)
    } else if state.isPaused {
      ProgressView(
        value: staticProgress(state: state),
        total: 1.0
      )
      .tint(progressColor(state: state))
    } else if let endDate = state.timerEndDate, let safe = safeEndDate(endDate) {
      let startDate = safe.addingTimeInterval(-Double(state.totalDurationSeconds))
      ProgressView(timerInterval: startDate...safe, countsDown: false)
        .tint(.green)
    } else if state.timerEndDate != nil {
      ProgressView(value: 1.0, total: 1.0)
        .tint(.green)
    } else {
      ProgressView(value: 0, total: 1.0)
        .tint(.green)
    }
  }
}

/// Returns endDate only if it's still in the future, eliminating the TOCTOU race
/// between checking `Date() >= endDate` and constructing `Date.now...endDate`.
private func safeEndDate(_ endDate: Date) -> Date? {
  endDate > Date() ? endDate : nil
}

private func formatTime(_ seconds: Int) -> String {
  let mins = seconds / 60
  let secs = seconds % 60
  return String(format: "%02d:%02d", mins, secs)
}

private func staticProgress(state: GuidrTimerAttributes.ContentState) -> Double {
  guard state.totalDurationSeconds > 0 else { return 0 }
  let remaining = Double(max(0, state.remainingSeconds))
  return 1.0 - (remaining / Double(state.totalDurationSeconds))
}

private func progressColor(state: GuidrTimerAttributes.ContentState) -> Color {
  guard state.totalDurationSeconds > 0 else { return .green }
  let ratio = Double(state.remainingSeconds) / Double(state.totalDurationSeconds)
  if ratio > 0.5 {
    return .green
  } else if ratio > 0.25 {
    return .yellow
  } else {
    return .red
  }
}

private func compactColor(state: GuidrTimerAttributes.ContentState) -> Color {
  if state.isComplete { return .green }
  if state.isPaused { return .orange }
  return progressColor(state: state)
}
