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
  FlatList: 'FlatList',
  Modal: 'Modal',
  Pressable: 'Pressable',
  Alert: {
    alert: jest.fn(),
  },
  AppState: {
    currentState: 'active',
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
  Platform: {
    OS: 'android',
    select: (obj) => obj.android,
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
    NotificationModule: {
      scheduleNotification: jest.fn(() => Promise.resolve()),
      cancelNotification: jest.fn(() => Promise.resolve()),
      cancelAllNotifications: jest.fn(() => Promise.resolve()),
      showNotification: jest.fn(() => Promise.resolve()),
      showUpdateNotification: jest.fn(() => Promise.resolve()),
    },
    WidgetModule: {
      updateWidget: jest.fn(() => Promise.resolve()),
      clearWidget: jest.fn(() => Promise.resolve()),
      getAndClearWidgetLaunchTarget: jest.fn(() => Promise.resolve(null)),
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
