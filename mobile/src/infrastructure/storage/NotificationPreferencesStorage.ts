import AsyncStorage from '@react-native-async-storage/async-storage'
import { NativeModules, Platform } from 'react-native'

const TIMER_NOTIFICATIONS_KEY = 'Guidr_TimerNotificationsEnabled'
const CRITICAL_NOTIFICATIONS_KEY = 'Guidr_CriticalNotificationsEnabled'

const { NotificationModule } = NativeModules

export class NotificationPreferencesStorage {
  async getTimerNotificationsEnabled(): Promise<boolean> {
    const value = await AsyncStorage.getItem(TIMER_NOTIFICATIONS_KEY)
    // Default to true when no value stored
    return value !== 'false'
  }

  async setTimerNotificationsEnabled(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(TIMER_NOTIFICATIONS_KEY, enabled.toString())
    if (Platform.OS === 'ios') {
      try {
        await NotificationModule.syncPreferences(enabled, await this.getCriticalNotificationsEnabled())
      } catch {
        // Non-critical — native sync failure shouldn't block JS
      }
    }
  }

  async getCriticalNotificationsEnabled(): Promise<boolean> {
    const value = await AsyncStorage.getItem(CRITICAL_NOTIFICATIONS_KEY)
    // Default to false
    return value === 'true'
  }

  async setCriticalNotificationsEnabled(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(CRITICAL_NOTIFICATIONS_KEY, enabled.toString())
    if (Platform.OS === 'ios') {
      try {
        await NotificationModule.syncPreferences(await this.getTimerNotificationsEnabled(), enabled)
      } catch {
        // Non-critical — native sync failure shouldn't block JS
      }
    }
  }
}
