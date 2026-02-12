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
      return await LiveActivityModule.startActivity(
        data.stepId,
        data.guideTitle,
        data.stepTitle,
        data.totalDurationSeconds,
        data.remainingSeconds,
      )
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
