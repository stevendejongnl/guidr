import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeScreen } from '../components/SafeScreen'
import { colors, spacing, typography } from '@guidr/shared/tokens'
import { commonStyles } from '@guidr/shared/styles/react-native'

const RETRY_INTERVAL_SECONDS = 10

interface ServerMaintenanceScreenProps {
  onRetry: () => void
  onChangeServer: () => void
}

export const ServerMaintenanceScreen: React.FC<ServerMaintenanceScreenProps> = ({
  onRetry,
  onChangeServer,
}) => {
  const [countdown, setCountdown] = useState(RETRY_INTERVAL_SECONDS)

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          onRetry()
          return RETRY_INTERVAL_SECONDS
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [onRetry])

  const handleRetryNow = () => {
    setCountdown(RETRY_INTERVAL_SECONDS)
    onRetry()
  }

  return (
    <SafeScreen>
      <View style={commonStyles.container}>
        <View style={commonStyles.contentCentered}>
          <Text style={styles.icon}>🔧</Text>
          <Text style={styles.title}>Server Maintenance</Text>
          <Text style={styles.description}>
            The server is currently unavailable. Please try again later.
          </Text>
          <Text style={styles.countdown}>
            Checking again in {countdown}s...
          </Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRetryNow}
            accessibilityLabel="Try Again Now"
          >
            <Text style={commonStyles.buttonText}>Try Again Now</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={commonStyles.buttonOutline}
            onPress={onChangeServer}
            accessibilityLabel="Change server"
          >
            <Text style={commonStyles.buttonTextMuted}>Change Server</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeScreen>
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
  countdown: {
    fontSize: typography.sizeSm,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xxxl,
  },
  retryButton: {
    backgroundColor: colors.buttonPrimary,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: spacing.xxxl,
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
})
