import SwiftUI
import WidgetKit

@main
struct GuidrTimerWidgetBundle: WidgetBundle {
  init() {
    NSLog("[GuidrWidget] WidgetBundle init — extension process launched")
    SharedDiagnosticLogger.shared.log("[WidgetBundle] init — extension process launched")
  }

  var body: some Widget {
    let _ = SharedDiagnosticLogger.shared.log("[WidgetBundle] body evaluated")
    // Track 2: GuidrHomeWidget temporarily disabled to isolate Live Activity rendering
    // GuidrHomeWidget()
    if #available(iOS 16.1, *) {
      GuidrTimerWidgetLiveActivity()
    }
  }
}
