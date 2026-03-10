import AsyncStorage from '@react-native-async-storage/async-storage'

const DEBUG_MODE_KEY = 'Guidr_DebugMode'

export class DebugModeStorage {
  async getDebugMode(): Promise<boolean> {
    const value = await AsyncStorage.getItem(DEBUG_MODE_KEY)
    return value === 'true'
  }

  async setDebugMode(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(DEBUG_MODE_KEY, enabled.toString())
  }
}
