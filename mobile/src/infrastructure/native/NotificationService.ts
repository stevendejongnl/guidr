import { NativeModules, Platform, PermissionsAndroid } from 'react-native'

const { NotificationModule } = NativeModules

export class NotificationService {
  async requestPermission(): Promise<boolean> {
    try {
      if (Platform.Version >= 33) {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        )
        return result === PermissionsAndroid.RESULTS.GRANTED
      }
      // Android < 33 doesn't need runtime permission
      return true
    } catch {
      return false
    }
  }

  async scheduleTimerNotification(
    stepId: string,
    stepTitle: string,
    guideTitle: string,
    remainingSeconds: number,
    critical: boolean,
  ): Promise<void> {
    try {
      await NotificationModule.scheduleNotification(
        stepId,
        stepTitle,
        guideTitle,
        remainingSeconds,
        critical,
      )
    } catch {
      // Notifications are non-critical — silently fail
    }
  }

  async cancelTimerNotification(stepId: string): Promise<void> {
    try {
      await NotificationModule.cancelNotification(stepId)
    } catch {
      // Non-critical
    }
  }

  async cancelAllTimerNotifications(): Promise<void> {
    try {
      await NotificationModule.cancelAllNotifications()
    } catch {
      // Non-critical
    }
  }

  async showImmediateNotification(
    stepId: string,
    stepTitle: string,
    guideTitle: string,
    critical: boolean,
  ): Promise<void> {
    if (Platform.OS !== 'android') return
    try {
      await NotificationModule.showNotification(stepId, stepTitle, guideTitle, critical)
    } catch {
      // Non-critical
    }
  }
}
