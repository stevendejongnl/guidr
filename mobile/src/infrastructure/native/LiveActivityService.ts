import { NativeModules, Platform } from 'react-native'

const { LiveActivityModule } = NativeModules

export interface LiveActivityData {
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
        data.guideTitle,
        data.stepTitle,
        data.totalDurationSeconds,
        data.remainingSeconds,
      )
    } catch {
      return null
    }
  }

  async updateLiveActivity(
    remainingSeconds: number,
    isPaused: boolean,
    isComplete: boolean,
  ): Promise<void> {
    if (Platform.OS !== 'ios') return
    try {
      await LiveActivityModule.updateActivity(remainingSeconds, isPaused, isComplete)
    } catch {
      // Live Activities are non-critical — silently fail
    }
  }

  async endLiveActivity(): Promise<void> {
    if (Platform.OS !== 'ios') return
    try {
      await LiveActivityModule.endActivity()
    } catch {
      // Live Activities are non-critical — silently fail
    }
  }
}
