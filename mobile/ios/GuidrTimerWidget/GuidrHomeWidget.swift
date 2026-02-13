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
    ZStack {
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

      #if DEBUG
      VStack {
        Spacer()
        HStack {
          Spacer()
          Text("\(entry.entries.count)e \(entry.activeCount)a")
            .font(.system(size: 7, design: .monospaced))
            .foregroundColor(.white.opacity(0.5))
            .padding(2)
            .background(Color.black.opacity(0.4))
            .cornerRadius(2)
        }
      }
      #endif
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
        .widgetPrimaryText()
      Text("No active timers")
        .font(.caption)
        .widgetTertiaryText()
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
          .widgetAccentable()
        Text("Guidr")
          .font(.caption2)
          .widgetTertiaryText()
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
          .widgetAccentable()
      }

      if let timer = primary {
        Text(timer.stepTitle)
          .font(.caption)
          .widgetSecondaryText()
          .lineLimit(2)
      }

      if entry.activeCount > 1 {
        Text("+\(entry.activeCount - 1) more")
          .font(.caption2)
          .widgetDimText()
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
          .widgetAccentable()
        Text("Guidr")
          .font(.caption2)
          .widgetTertiaryText()
          .textCase(.uppercase)
      }

      HStack {
        if let timer = primary {
          Text(timer.guideTitle)
            .font(.headline)
            .widgetPrimaryText()
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
            .widgetAccentable()
            .fixedSize(horizontal: true, vertical: false)
        }
      }

      if let timer = primary {
        Text(timer.stepTitle)
          .font(.subheadline)
          .widgetSecondaryText()
          .lineLimit(1)
      }

      if entry.activeCount > 1 {
        Text("+\(entry.activeCount - 1) more timer\(entry.activeCount > 2 ? "s" : "")")
          .font(.caption2)
          .widgetTertiaryText()
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
    } else if let endDate = timer.endDate, let safe = homeSafeEndDate(endDate) {
      Text(timerInterval: Date.now...safe, countsDown: true)
        .foregroundColor(homeProgressColor(timer: timer))
        .monospacedDigit()
    } else if timer.endDate != nil {
      Text("Done")
        .foregroundColor(.green)
        .fontWeight(.semibold)
    } else {
      Text(homeFormatTime(timer.remainingSeconds))
        .widgetPrimaryText()
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
    } else if let endDate = timer.endDate, let safe = homeSafeEndDate(endDate) {
      let startDate = safe.addingTimeInterval(-Double(timer.totalDurationSeconds))
      ProgressView(timerInterval: startDate...safe, countsDown: false)
        .tint(.green)
    } else if timer.endDate != nil {
      ProgressView(value: 1.0, total: 1.0)
        .tint(.green)
    } else {
      ProgressView(value: 0, total: 1.0)
        .tint(.green)
    }
  }
}

// MARK: - Helpers

/// Returns endDate only if it's still in the future, eliminating the TOCTOU race
/// between checking `Date() >= endDate` and constructing `Date.now...endDate`.
private func homeSafeEndDate(_ endDate: Date) -> Date? {
  endDate > Date() ? endDate : nil
}

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
