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
import { commonStyles, colors, spacing, typography, borderRadius } from '../theme'

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
    <View style={commonStyles.container}>
      <View style={commonStyles.contentCentered}>
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
          <Text style={commonStyles.buttonText}>{getUpdateButtonText()}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={commonStyles.buttonOutline}
          onPress={onChangeServer}
          accessibilityLabel="Change server"
        >
          <Text style={commonStyles.buttonTextMuted}>Change Server</Text>
        </TouchableOpacity>
      </View>
      <VersionDisplay />
    </View>
  )
}

const styles = StyleSheet.create({
  icon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.sizeXxl,
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  description: {
    fontSize: typography.sizeMd,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    lineHeight: 24,
  },
  versionInfo: {
    fontSize: typography.sizeSm,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xxxl,
  },
  updateButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.xxxl,
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
})

