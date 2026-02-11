module.exports = {
  View: 'View',
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  ActivityIndicator: 'ActivityIndicator',
  Image: 'Image',
  KeyboardAvoidingView: 'KeyboardAvoidingView',
  SafeAreaView: 'SafeAreaView',
  ScrollView: 'ScrollView',
  Switch: 'Switch',
  Modal: 'Modal',
  Pressable: 'Pressable',
  Alert: {
    alert: jest.fn(),
  },
  Platform: {
    OS: 'ios',
    select: (obj) => obj.ios,
  },
  StyleSheet: {
    create: (styles) => styles,
    flatten: (style) => (Array.isArray(style) ? Object.assign({}, ...style) : style),
  },
  Linking: {
    canOpenURL: jest.fn(() => Promise.resolve(true)),
    openURL: jest.fn(() => Promise.resolve()),
  },
  NativeModules: {
    ApkInstallerModule: {
      installApk: jest.fn(() => Promise.resolve()),
    },
    LiveActivityModule: {
      isAvailable: jest.fn(() => Promise.resolve(false)),
      startActivity: jest.fn(() => Promise.resolve(null)),
      updateActivity: jest.fn(() => Promise.resolve()),
      removeTimer: jest.fn(() => Promise.resolve()),
      endActivity: jest.fn(() => Promise.resolve()),
    },
    NotificationModule: {
      scheduleNotification: jest.fn(() => Promise.resolve()),
      cancelNotification: jest.fn(() => Promise.resolve()),
      cancelAllNotifications: jest.fn(() => Promise.resolve()),
      showNotification: jest.fn(() => Promise.resolve()),
      requestPermission: jest.fn(() => Promise.resolve(true)),
      syncPreferences: jest.fn(() => Promise.resolve()),
    },
  },
  PermissionsAndroid: {
    request: jest.fn(() => Promise.resolve('granted')),
    check: jest.fn(() => Promise.resolve(true)),
    PERMISSIONS: {
      POST_NOTIFICATIONS: 'android.permission.POST_NOTIFICATIONS',
    },
    RESULTS: {
      GRANTED: 'granted',
      DENIED: 'denied',
      NEVER_ASK_AGAIN: 'never_ask_again',
    },
  },
}
