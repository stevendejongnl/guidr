import AsyncStorage from '@react-native-async-storage/async-storage'

const TIMER_NOTIFICATIONS_KEY = 'Guidr_TimerNotificationsEnabled'
const CRITICAL_NOTIFICATIONS_KEY = 'Guidr_CriticalNotificationsEnabled'

export class NotificationPreferencesStorage {
  async getTimerNotificationsEnabled(): Promise<boolean> {
    const value = await AsyncStorage.getItem(TIMER_NOTIFICATIONS_KEY)
    // Default to true when no value stored
    return value !== 'false'
  }

  async setTimerNotificationsEnabled(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(TIMER_NOTIFICATIONS_KEY, enabled.toString())
  }

  async getCriticalNotificationsEnabled(): Promise<boolean> {
    const value = await AsyncStorage.getItem(CRITICAL_NOTIFICATIONS_KEY)
    // Default to false
    return value === 'true'
  }

  async setCriticalNotificationsEnabled(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(CRITICAL_NOTIFICATIONS_KEY, enabled.toString())
  }
}
