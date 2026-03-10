import { NativeModules, Platform } from 'react-native'

const { CrashLogModule } = NativeModules

export class CrashLogService {
  async getEntries(): Promise<string[]> {
    if (Platform.OS !== 'ios') return []
    try {
      return await CrashLogModule.getEntries()
    } catch {
      return []
    }
  }

  async clear(): Promise<void> {
    if (Platform.OS !== 'ios') return
    try {
      await CrashLogModule.clear()
    } catch {
      // best-effort
    }
  }
}
