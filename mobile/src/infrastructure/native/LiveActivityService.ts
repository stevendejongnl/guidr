import { NativeModules, Platform } from 'react-native'
import { ErrorReporter } from '../monitoring/ErrorReporter'

const { LiveActivityModule } = NativeModules

export interface LiveActivityData {
  stepId: string
  guideTitle: string
  stepTitle: string
  totalDurationSeconds: number
  remainingSeconds: number
}

export class LiveActivityService {
  async isAvailable(): Promise<boolean> {
    if (Platform.OS !== 'ios') return false
    try {
      return await LiveActivityModule.isAvailable()
    } catch {
      return false
    }
  }

  async startLiveActivity(data: LiveActivityData): Promise<string | null> {
    if (Platform.OS !== 'ios') return null
    try {
      const available = await this.isAvailable()
      console.warn('[LiveActivityService] available=', available)
      ErrorReporter.captureMessage('LiveActivity.start', 'warning', {
        component: 'LiveActivityService',
        action: 'startLiveActivity',
        available: available,
        stepId: data.stepId,
        totalDurationSeconds: data.totalDurationSeconds,
        remainingSeconds: data.remainingSeconds,
      })
      const activityId = await LiveActivityModule.startActivity(
        data.stepId,
        data.guideTitle,
        data.stepTitle,
        data.totalDurationSeconds,
        data.remainingSeconds,
      )
      ErrorReporter.captureMessage(
        `LiveActivity.started: ${activityId ? 'ok' : 'null'}`,
        activityId ? 'info' : 'warning',
        {
          component: 'LiveActivityService',
          action: 'startLiveActivity.result',
          activityId: activityId ?? 'null',
        },
      )
      return activityId
    } catch (error) {
      ErrorReporter.capture(error, { component: 'LiveActivityService', action: 'startLiveActivity' })
      return null
    }
  }

  async updateLiveActivity(
    stepId: string,
    remainingSeconds: number,
    isPaused: boolean,
    isComplete: boolean,
  ): Promise<void> {
    if (Platform.OS !== 'ios') return
    try {
      await LiveActivityModule.updateActivity(stepId, remainingSeconds, isPaused, isComplete)
    } catch (error) {
      console.warn('[LiveActivityService] Failed to update:', error)
    }
  }

  async removeLiveActivityTimer(stepId: string): Promise<void> {
    if (Platform.OS !== 'ios') return
    try {
      await LiveActivityModule.removeTimer(stepId)
    } catch (error) {
      console.warn('[LiveActivityService] Failed to remove timer:', error)
    }
  }

  async endLiveActivity(): Promise<void> {
    if (Platform.OS !== 'ios') return
    try {
      await LiveActivityModule.endActivity()
    } catch (error) {
      console.warn('[LiveActivityService] Failed to end:', error)
    }
  }
}
