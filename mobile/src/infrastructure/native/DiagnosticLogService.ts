import { NativeModules, Platform } from 'react-native'

const { DiagnosticLogModule } = NativeModules

export class DiagnosticLogService {
  async getEntries(): Promise<string[]> {
    if (Platform.OS !== 'ios') return []
    try {
      return await DiagnosticLogModule.getEntries()
    } catch {
      return []
    }
  }

  async log(message: string): Promise<void> {
    if (Platform.OS !== 'ios') return
    try {
      await DiagnosticLogModule.log(message)
    } catch {
      // best-effort
    }
  }

  async clear(): Promise<void> {
    if (Platform.OS !== 'ios') return
    try {
      await DiagnosticLogModule.clear()
    } catch (_err) {
      // intentionally suppressed — clear is best-effort
    }
  }
}
