import React, { useState } from 'react'
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native'
import DeviceInfo from 'react-native-device-info'
import { GitHubReleaseClient } from '../../infrastructure/api/GitHubReleaseClient'
import { UpdateCheckStorage } from '../../infrastructure/storage/UpdateCheckStorage'
import { UpdateService, UpdateCheckResult } from '../../domain/services/UpdateService'
import { commonStyles, colors, spacing, typography } from '../theme'

interface UpdateButtonProps {
  serverConfig: { minAppVersion?: string | null }
  onCheckComplete: (result: UpdateCheckResult) => void
}

export const UpdateButton: React.FC<UpdateButtonProps> = ({
  serverConfig,
  onCheckComplete,
}) => {
  const [checking, setChecking] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)

  const handleCheckForUpdates = async () => {
    setChecking(true)
    setMessage(null)
    setIsError(false)

    try {
      const currentVersion = DeviceInfo.getVersion()
      const githubClient = new GitHubReleaseClient()
      const storage = new UpdateCheckStorage()
      const updateService = new UpdateService(
        githubClient,
        storage,
        serverConfig
      )

      const result = await updateService.checkForUpdates(currentVersion, true)

      if (result.updateAvailable) {
        setMessage(
          `Update available: v${result.latestVersion}${result.isMandatory ? ' (Required)' : ''}`
        )
        setIsError(false)
        onCheckComplete(result)
      } else {
        setMessage(`You're on the latest version (v${currentVersion})`)
        setIsError(false)
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to check for updates'
      setMessage(errorMessage)
      setIsError(true)
    } finally {
      setChecking(false)
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={commonStyles.button}
        onPress={handleCheckForUpdates}
        disabled={checking}
        accessibilityLabel="Check for updates"
      >
        {checking ? (
          <ActivityIndicator color={colors.background} />
        ) : (
          <Text style={commonStyles.buttonText}>Check for Updates</Text>
        )}
      </TouchableOpacity>

      {message && (
        <Text
          style={[
            styles.message,
            isError ? commonStyles.errorText : commonStyles.successText,
          ]}
        >
          {message}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  message: {
    marginTop: spacing.md,
    textAlign: 'center',
    fontSize: typography.sizeSm,
  },
})
