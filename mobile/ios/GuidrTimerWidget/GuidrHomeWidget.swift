import SwiftUI
import WidgetKit

struct GuidrHomeWidget: Widget {
  let kind = "GuidrHomeWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: HomeWidgetTimelineProvider()) { entry in
      HomeWidgetEntryView(entry: entry)
        .widgetBackground()
    }
    .configurationDisplayName("Guidr Timer")
    .description("See your active timer countdown on the home screen.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

// MARK: - Entry View

private struct HomeWidgetEntryView: View {
  @Environment(\.widgetFamily) var family
  let entry: HomeWidgetEntry

  var body: some View {
    if entry.hasTimers {
      switch family {
      case .systemMedium:
        MediumTimerView(entry: entry)
      default:
        SmallTimerView(entry: entry)
      }
    } else {
      IdleView()
    }
  }
}

// MARK: - Idle View

private struct IdleView: View {
  var body: some View {
    VStack(spacing: 8) {
      HomeGuidrDotsView()
      Text("Guidr")
        .font(.headline)
        .foregroundColor(.white)
      Text("No active timers")
        .font(.caption)
        .foregroundColor(.white.opacity(0.5))
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
  }
}

// MARK: - Small Widget

private struct SmallTimerView: View {
  let entry: HomeWidgetEntry

  private var primary: SharedTimerEntry? { entry.primaryEntry }

  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      HStack(spacing: 4) {
        HomeGuidrDotsView()
        Text("Guidr")
          .font(.caption2)
          .foregroundColor(.white.opacity(0.5))
          .textCase(.uppercase)
      }

      Spacer(minLength: 0)

      if entry.allComplete {
        Text("Done")
          .font(.title2.weight(.semibold))
          .foregroundColor(.green)
      } else if let timer = primary {
        TimerCountdownText(timer: timer)
          .font(.title2.monospacedDigit())
      }

      if let timer = primary {
        Text(timer.stepTitle)
          .font(.caption)
          .foregroundColor(.white.opacity(0.7))
          .lineLimit(2)
      }

      if entry.activeCount > 1 {
        Text("+\(entry.activeCount - 1) more")
          .font(.caption2)
          .foregroundColor(.white.opacity(0.4))
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    .padding(2)
  }
}

// MARK: - Medium Widget

private struct MediumTimerView: View {
  let entry: HomeWidgetEntry

  private var primary: SharedTimerEntry? { entry.primaryEntry }

  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      HStack(spacing: 4) {
        HomeGuidrDotsView()
        Text("Guidr")
          .font(.caption2)
          .foregroundColor(.white.opacity(0.5))
          .textCase(.uppercase)
      }

      HStack {
        if let timer = primary {
          Text(timer.guideTitle)
            .font(.headline)
            .foregroundColor(.white)
            .lineLimit(1)
        }
        Spacer(minLength: 8)

        if entry.allComplete {
          Text("Done")
            .font(.title2.weight(.semibold))
            .foregroundColor(.green)
        } else if let timer = primary {
          TimerCountdownText(timer: timer)
            .font(.title2.monospacedDigit())
        }
      }

      if let timer = primary {
        Text(timer.stepTitle)
          .font(.subheadline)
          .foregroundColor(.white.opacity(0.7))
          .lineLimit(1)
      }

      if entry.activeCount > 1 {
        Text("+\(entry.activeCount - 1) more timer\(entry.activeCount > 2 ? "s" : "")")
          .font(.caption2)
          .foregroundColor(.white.opacity(0.5))
      }

      if let timer = primary {
        HomeProgressView(timer: timer, allComplete: entry.allComplete)
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    .padding(2)
  }
}

// MARK: - Shared Components

private struct HomeGuidrDotsView: View {
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
  }
}

private struct TimerCountdownText: View {
  let timer: SharedTimerEntry

  var body: some View {
    if timer.isComplete {
      Text("Done")
        .foregroundColor(.green)
        .fontWeight(.semibold)
    } else if timer.isPaused {
      Text(homeFormatTime(timer.remainingSeconds))
        .foregroundColor(.orange)
    } else if let endDate = timer.endDate, Date() >= endDate {
      Text("Done")
        .foregroundColor(.green)
        .fontWeight(.semibold)
    } else if let endDate = timer.endDate {
      Text(timerInterval: Date.now...endDate, countsDown: true)
        .foregroundColor(homeProgressColor(timer: timer))
        .monospacedDigit()
    } else {
      Text(homeFormatTime(timer.remainingSeconds))
        .foregroundColor(.white)
    }
  }
}

private struct HomeProgressView: View {
  let timer: SharedTimerEntry
  let allComplete: Bool

  var body: some View {
    if allComplete || timer.isComplete {
      ProgressView(value: 1.0, total: 1.0)
        .tint(.green)
    } else if timer.isPaused {
      ProgressView(value: homeStaticProgress(timer: timer), total: 1.0)
        .tint(homeProgressColor(timer: timer))
    } else if let endDate = timer.endDate, Date() >= endDate {
      ProgressView(value: 1.0, total: 1.0)
        .tint(.green)
    } else if let endDate = timer.endDate {
      let startDate = endDate.addingTimeInterval(-Double(timer.totalDurationSeconds))
      ProgressView(timerInterval: startDate...endDate, countsDown: false)
        .tint(.green)
    } else {
      ProgressView(value: 0, total: 1.0)
        .tint(.green)
    }
  }
}

// MARK: - Helpers

private func homeFormatTime(_ seconds: Int) -> String {
  let mins = seconds / 60
  let secs = seconds % 60
  return String(format: "%02d:%02d", mins, secs)
}

private func homeStaticProgress(timer: SharedTimerEntry) -> Double {
  guard timer.totalDurationSeconds > 0 else { return 0 }
  let remaining = Double(max(0, timer.remainingSeconds))
  return 1.0 - (remaining / Double(timer.totalDurationSeconds))
}

private func homeProgressColor(timer: SharedTimerEntry) -> Color {
  guard timer.totalDurationSeconds > 0 else { return .green }
  let ratio = Double(timer.remainingSeconds) / Double(timer.totalDurationSeconds)
  if ratio > 0.5 {
    return .green
  } else if ratio > 0.25 {
    return .yellow
  } else {
    return .red
  }
}

// MARK: - Background Modifier

private extension View {
  @ViewBuilder
  func widgetBackground() -> some View {
    if #available(iOSApplicationExtension 17.0, *) {
      self.containerBackground(for: .widget) {
        Color.black
      }
    } else {
      self.background(Color.black)
    }
  }
}
