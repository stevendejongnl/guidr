import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Linking,
} from 'react-native'
import { VersionDisplay } from '../components/VersionDisplay'

interface AppOutdatedScreenProps {
  currentVersion: string
  minVersion?: string | null
  maxVersion?: string | null
  onChangeServer: () => void
}

const ANDROID_RELEASES_URL = 'https://github.com/stevendejongnl/guidr/releases/latest'
const IOS_TESTFLIGHT_URL = 'itms-beta://'

export const AppOutdatedScreen: React.FC<AppOutdatedScreenProps> = ({
  currentVersion,
  minVersion,
  maxVersion,
  onChangeServer,
}) => {
  const handleUpdatePress = async () => {
    const url = Platform.OS === 'ios' ? IOS_TESTFLIGHT_URL : ANDROID_RELEASES_URL
    const canOpen = await Linking.canOpenURL(url)
    if (canOpen) {
      await Linking.openURL(url)
    }
  }

  const getVersionMessage = () => {
    if (minVersion && maxVersion) {
      return `This server requires app version ${minVersion} - ${maxVersion}.`
    } else if (minVersion) {
      return `This server requires app version ${minVersion} or higher.`
    } else if (maxVersion) {
      return `This server requires app version ${maxVersion} or lower.`
    }
    return 'Your app version is not supported by this server.'
  }

  const getUpdateButtonText = () => {
    return Platform.OS === 'ios' ? 'Open TestFlight' : 'Download Update'
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>⚠️</Text>
        <Text style={styles.title}>Update Required</Text>
        <Text style={styles.description}>
          Your current app version ({currentVersion}) is not compatible with this server.
        </Text>
        <Text style={styles.versionInfo}>{getVersionMessage()}</Text>

        <TouchableOpacity
          style={styles.updateButton}
          onPress={handleUpdatePress}
          accessibilityLabel={getUpdateButtonText()}
        >
          <Text style={styles.updateButtonText}>{getUpdateButtonText()}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.changeServerButton}
          onPress={onChangeServer}
          accessibilityLabel="Change server"
        >
          <Text style={styles.changeServerButtonText}>Change Server</Text>
        </TouchableOpacity>
      </View>
      <VersionDisplay />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  versionInfo: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 32,
  },
  updateButton: {
    backgroundColor: '#2196f3',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  changeServerButton: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#999',
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
  },
  changeServerButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
})

