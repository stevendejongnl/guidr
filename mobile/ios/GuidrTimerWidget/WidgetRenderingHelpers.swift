import SwiftUI

/// Shared adaptive text helpers for widget and Live Activity views.
/// On iOS 17+ uses semantic `foregroundStyle` which adapts to Liquid Glass
/// rendering modes (fullColor, accented, vibrant). Falls back to hardcoded
/// white on iOS 16.
extension View {
  @ViewBuilder
  func widgetPrimaryText() -> some View {
    if #available(iOSApplicationExtension 17.0, *) {
      self.foregroundStyle(.primary)
    } else {
      self.foregroundColor(.white)
    }
  }

  @ViewBuilder
  func widgetSecondaryText() -> some View {
    if #available(iOSApplicationExtension 17.0, *) {
      self.foregroundStyle(.secondary)
    } else {
      self.foregroundColor(.white.opacity(0.7))
    }
  }

  @ViewBuilder
  func widgetTertiaryText() -> some View {
    if #available(iOSApplicationExtension 17.0, *) {
      self.foregroundStyle(.tertiary)
    } else {
      self.foregroundColor(.white.opacity(0.5))
    }
  }

  @ViewBuilder
  func widgetDimText() -> some View {
    if #available(iOSApplicationExtension 17.0, *) {
      self.foregroundStyle(.tertiary)
    } else {
      self.foregroundColor(.white.opacity(0.4))
    }
  }
}
