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
  },
}
