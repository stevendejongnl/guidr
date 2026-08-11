import { NativeModules, Platform } from 'react-native'

const { WidgetModule } = NativeModules

export interface WidgetTimerData {
  stepId: string
  guideTitle: string
  stepTitle: string
  totalDurationSeconds: number
  remainingSeconds: number
  isPaused: boolean
  isComplete: boolean
}

export class WidgetService {
  async updateWidget(data: WidgetTimerData): Promise<void> {
    if (Platform.OS !== 'android') return
    try {
      await WidgetModule.updateWidget(
        data.stepId,
        data.guideTitle,
        data.stepTitle,
        data.totalDurationSeconds,
        data.remainingSeconds,
        data.isPaused,
        data.isComplete,
      )
    } catch (error) {
      console.warn('[WidgetService] Failed to update widget:', error)
    }
  }

  async clearWidget(): Promise<void> {
    if (Platform.OS !== 'android') return
    try {
      await WidgetModule.clearWidget()
    } catch (error) {
      console.warn('[WidgetService] Failed to clear widget:', error)
    }
  }
}
