import SwiftUI
import WidgetKit

@main
struct GuidrTimerWidgetBundle: WidgetBundle {
  var body: some Widget {
    if #available(iOS 16.1, *) {
      GuidrTimerWidgetLiveActivity()
    }
  }
}
