import { NativeModules, Platform } from 'react-native'
import { ErrorReporter } from '../monitoring/ErrorReporter'

// Read fresh on every call rather than destructured once at module load —
// native module registration can outrace this module's own import order,
// and reading it live also lets tests simulate a missing module cleanly.
const getWidgetModule = () => NativeModules.WidgetModule

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
      const WidgetModule = getWidgetModule()
      if (!WidgetModule) {
        throw new Error('WidgetModule native module is not linked')
      }
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
      ErrorReporter.capture(error, { component: 'WidgetService', action: 'updateWidget' })
    }
  }

  async clearWidget(stepId: string): Promise<void> {
    if (Platform.OS !== 'android') return
    try {
      const WidgetModule = getWidgetModule()
      if (!WidgetModule) {
        throw new Error('WidgetModule native module is not linked')
      }
      await WidgetModule.clearWidget(stepId)
    } catch (error) {
      console.warn('[WidgetService] Failed to clear widget:', error)
      ErrorReporter.capture(error, { component: 'WidgetService', action: 'clearWidget' })
    }
  }

  // Reads the guide/step the widget was tapped for, if any, and clears it so it's
  // only consumed once (called on cold start and whenever the app resumes to the
  // foreground, since a running app reuses its Activity via singleTask + onNewIntent).
  async getAndClearLaunchTarget(): Promise<WidgetLaunchTarget | null> {
    if (Platform.OS !== 'android') return null
    try {
      const WidgetModule = getWidgetModule()
      if (!WidgetModule) {
        throw new Error('WidgetModule native module is not linked')
      }
      const target = await WidgetModule.getAndClearWidgetLaunchTarget()
      return target ?? null
    } catch (error) {
      console.warn('[WidgetService] Failed to read widget launch target:', error)
      ErrorReporter.capture(error, { component: 'WidgetService', action: 'getAndClearLaunchTarget' })
      return null
    }
  }
}
