import ActivityKit
import SwiftUI
import WidgetKit

@available(iOS 16.1, *)
struct GuidrTimerWidgetLiveActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: GuidrTimerAttributes.self) { context in
      LockScreenView(context: context)
        .padding()
        .activityBackgroundTint(Color.black.opacity(0.85))
        .activitySystemActionForegroundColor(Color.white)
    } dynamicIsland: { context in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          Label(context.attributes.stepTitle, systemImage: "timer")
            .font(.caption)
            .foregroundColor(.white)
        }
        DynamicIslandExpandedRegion(.trailing) {
          TimerText(state: context.state, totalDuration: context.attributes.totalDurationSeconds)
        }
        DynamicIslandExpandedRegion(.bottom) {
          ProgressView(
            value: progress(state: context.state, totalDuration: context.attributes.totalDurationSeconds),
            total: 1.0
          )
          .tint(progressColor(state: context.state, totalDuration: context.attributes.totalDurationSeconds))
        }
      } compactLeading: {
        Image(systemName: "timer")
          .foregroundColor(compactColor(state: context.state, totalDuration: context.attributes.totalDurationSeconds))
      } compactTrailing: {
        TimerText(state: context.state, totalDuration: context.attributes.totalDurationSeconds)
          .font(.caption)
      } minimal: {
        Image(systemName: "timer")
          .foregroundColor(compactColor(state: context.state, totalDuration: context.attributes.totalDurationSeconds))
      }
    }
  }
}

@available(iOS 16.1, *)
private struct LockScreenView: View {
  let context: ActivityViewContext<GuidrTimerAttributes>

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      HStack {
        Text(context.attributes.guideTitle)
          .font(.headline)
          .foregroundColor(.white)
          .lineLimit(1)
        Spacer()
        TimerText(state: context.state, totalDuration: context.attributes.totalDurationSeconds)
          .font(.title2.monospacedDigit())
          .foregroundColor(timerTextColor)
      }

      Text(context.attributes.stepTitle)
        .font(.subheadline)
        .foregroundColor(.white.opacity(0.7))
        .lineLimit(1)

      ProgressView(
        value: progress(state: context.state, totalDuration: context.attributes.totalDurationSeconds),
        total: 1.0
      )
      .tint(progressColor(state: context.state, totalDuration: context.attributes.totalDurationSeconds))
    }
  }

  private var timerTextColor: Color {
    if context.state.isComplete {
      return .green
    }
    if context.state.isPaused {
      return .orange
    }
    return progressColor(state: context.state, totalDuration: context.attributes.totalDurationSeconds)
  }
}

@available(iOS 16.1, *)
private struct TimerText: View {
  let state: GuidrTimerAttributes.ContentState
  let totalDuration: Int

  var body: some View {
    if state.isComplete {
      Text("Done")
        .foregroundColor(.green)
        .fontWeight(.semibold)
    } else if state.isPaused {
      Text(formatTime(state.remainingSeconds))
        .foregroundColor(.orange)
    } else if let endDate = state.timerEndDate {
      Text(timerInterval: Date.now...endDate, countsDown: true)
        .foregroundColor(progressColor(state: state, totalDuration: totalDuration))
        .monospacedDigit()
    } else {
      Text(formatTime(state.remainingSeconds))
        .foregroundColor(.white)
    }
  }
}

private func formatTime(_ seconds: Int) -> String {
  let mins = seconds / 60
  let secs = seconds % 60
  return String(format: "%02d:%02d", mins, secs)
}

private func progress(state: GuidrTimerAttributes.ContentState, totalDuration: Int) -> Double {
  guard totalDuration > 0 else { return 0 }
  let remaining = Double(max(0, state.remainingSeconds))
  return 1.0 - (remaining / Double(totalDuration))
}

private func progressColor(state: GuidrTimerAttributes.ContentState, totalDuration: Int) -> Color {
  guard totalDuration > 0 else { return .green }
  let ratio = Double(state.remainingSeconds) / Double(totalDuration)
  if ratio > 0.5 {
    return .green
  } else if ratio > 0.25 {
    return .yellow
  } else {
    return .red
  }
}

private func compactColor(state: GuidrTimerAttributes.ContentState, totalDuration: Int) -> Color {
  if state.isComplete { return .green }
  if state.isPaused { return .orange }
  return progressColor(state: state, totalDuration: totalDuration)
}
