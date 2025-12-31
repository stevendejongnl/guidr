import AsyncStorage from '@react-native-async-storage/async-storage'

export class UpdateCheckStorage {
  private static readonly LAST_CHECK_KEY = 'Guidr_LastUpdateCheck'
  private static readonly CACHE_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours

  async getLastCheckTimestamp(): Promise<Date | null> {
    try {
      const timestamp = await AsyncStorage.getItem(
        UpdateCheckStorage.LAST_CHECK_KEY
      )
      if (!timestamp) {
        return null
      }
      return new Date(timestamp)
    } catch (error) {
      console.error('Failed to get last update check timestamp:', error)
      return null
    }
  }

  async setLastCheckTimestamp(timestamp: Date): Promise<void> {
    try {
      await AsyncStorage.setItem(
        UpdateCheckStorage.LAST_CHECK_KEY,
        timestamp.toISOString()
      )
    } catch (error) {
      console.error('Failed to set last update check timestamp:', error)
      throw new Error('Failed to save update check timestamp')
    }
  }

  async shouldCheckForUpdates(): Promise<boolean> {
    try {
      const lastCheck = await this.getLastCheckTimestamp()
      if (!lastCheck) {
        return true // Never checked before
      }

      const now = new Date()
      const timeSinceLastCheck = now.getTime() - lastCheck.getTime()
      return timeSinceLastCheck >= UpdateCheckStorage.CACHE_DURATION_MS
    } catch (error) {
      console.error('Failed to determine if should check for updates:', error)
      return true // Default to checking on error
    }
  }

  async clearLastCheck(): Promise<void> {
    try {
      await AsyncStorage.removeItem(UpdateCheckStorage.LAST_CHECK_KEY)
    } catch (error) {
      console.error('Failed to clear last update check:', error)
      throw new Error('Failed to clear update check data')
    }
  }
}
