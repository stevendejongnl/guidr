import SwiftUI
import WidgetKit

@main
struct GuidrTimerWidgetBundle: WidgetBundle {
  init() {
    WidgetCrashReporter.shared.subscribe()
    NSLog("[GuidrWidget] WidgetBundle init — extension process launched")
    SharedDiagnosticLogger.shared.log("[WidgetBundle] init — extension process launched")
  }

  var body: some Widget {
    GuidrHomeWidget()
    GuidrTimerWidgetLiveActivity()
  }
}
