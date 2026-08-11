import { NativeModules, Platform } from 'react-native'

const { WidgetModule } = NativeModules

export interface WidgetTimerData {
  guideId: string
  stepId: string
  guideTitle: string
  stepTitle: string
  totalDurationSeconds: number
  remainingSeconds: number
  isPaused: boolean
  isComplete: boolean
}

export interface WidgetLaunchTarget {
  guideId: string
  stepId: string
}

export class WidgetService {
  async updateWidget(data: WidgetTimerData): Promise<void> {
    if (Platform.OS !== 'android') return
    try {
      await WidgetModule.updateWidget(
        data.guideId,
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

  // Reads the guide/step the widget was tapped for, if any, and clears it so it's
  // only consumed once (called on cold start and whenever the app resumes to the
  // foreground, since a running app reuses its Activity via singleTask + onNewIntent).
  async getAndClearLaunchTarget(): Promise<WidgetLaunchTarget | null> {
    if (Platform.OS !== 'android') return null
    try {
      const target = await WidgetModule.getAndClearWidgetLaunchTarget()
      return target ?? null
    } catch (error) {
      console.warn('[WidgetService] Failed to read widget launch target:', error)
      return null
    }
  }
}
