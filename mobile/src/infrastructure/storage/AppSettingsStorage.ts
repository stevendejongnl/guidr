import AsyncStorage from '@react-native-async-storage/async-storage'

// Local app preferences and behavior toggles — deliberately excludes
// account/connection state (auth tokens, server URL), which has its own
// "Change Server" / logout flows and shouldn't be touched by a settings reset.
const RESETTABLE_KEYS = [
  'Guidr_TimerNotificationsEnabled',
  'Guidr_CriticalNotificationsEnabled',
  'Guidr_DebugMode',
  'Guidr_SessionPreference_AutoAdvance',
  'Guidr_LastUpdateCheck',
]

export class AppSettingsStorage {
  async resetToDefaults(): Promise<void> {
    await AsyncStorage.multiRemove(RESETTABLE_KEYS)
  }
}
