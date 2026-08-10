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
    // Default to true — a completed step timer is time-sensitive by definition;
    // users who want quieter notifications can opt out via Settings.
    return value !== 'false'
  }

  async setCriticalNotificationsEnabled(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(CRITICAL_NOTIFICATIONS_KEY, enabled.toString())
  }
}
