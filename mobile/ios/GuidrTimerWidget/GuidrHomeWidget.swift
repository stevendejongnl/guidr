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
    Group {
      if timer.isComplete {
        Text("Done")
          .foregroundColor(.green)
          .fontWeight(.semibold)
      } else if timer.isPaused {
        Text(homeFormatTime(timer.remainingSeconds))
          .foregroundColor(.orange)
      } else if let endDate = timer.endDate {
        TimelineView(.periodic(from: .now, by: 1.0)) { _ in
          let computed = max(0, Int(ceil(endDate.timeIntervalSince(Date()))))
          Text(homeFormatTime(computed))
            .foregroundColor(TimerFormatting.progressColor(remaining: computed, total: timer.totalDurationSeconds))
            .monospacedDigit()
        }
      } else {
        Text(homeFormatTime(timer.remainingSeconds))
          .foregroundColor(homeProgressColor(timer: timer))
          .monospacedDigit()
      }
    }
    .contentTransitionIdentity()
  }
}

private struct HomeProgressView: View {
  let timer: SharedTimerEntry
  let allComplete: Bool

  var body: some View {
    Group {
      if allComplete || timer.isComplete {
        ProgressView(value: 1.0, total: 1.0)
          .tint(.green)
      } else if let endDate = timer.endDate, !timer.isPaused, timer.totalDurationSeconds > 0 {
        TimelineView(.periodic(from: .now, by: 1.0)) { _ in
          let remaining = max(0, Int(ceil(endDate.timeIntervalSince(Date()))))
          ProgressView(value: TimerFormatting.staticProgress(remaining: remaining, total: timer.totalDurationSeconds), total: 1.0)
            .tint(TimerFormatting.progressColor(remaining: remaining, total: timer.totalDurationSeconds))
        }
      } else {
        ProgressView(value: homeStaticProgress(timer: timer), total: 1.0)
          .tint(homeProgressColor(timer: timer))
      }
    }
    .contentTransitionIdentity()
  }
}

// MARK: - Helpers

private func homeFormatTime(_ seconds: Int) -> String {
  TimerFormatting.formatTime(seconds)
}

private func homeStaticProgress(timer: SharedTimerEntry) -> Double {
  TimerFormatting.staticProgress(remaining: timer.remainingSeconds, total: timer.totalDurationSeconds)
}

private func homeProgressColor(timer: SharedTimerEntry) -> Color {
  TimerFormatting.progressColor(remaining: timer.remainingSeconds, total: timer.totalDurationSeconds)
}

// MARK: - View Modifiers

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

  /// Suppress crossfade transitions between timeline entries (prevents flicker).
  @ViewBuilder
  func contentTransitionIdentity() -> some View {
    if #available(iOSApplicationExtension 17.0, *) {
      self.contentTransition(.identity)
    } else {
      self
    }
  }
}
