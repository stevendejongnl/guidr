import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, spacing, typography } from '@guidr/shared/tokens'

interface VersionDisplayProps {
  isVisible?: boolean
}

export const VersionDisplay: React.FC<VersionDisplayProps> = ({ isVisible = true }) => {
  const [version, setVersion] = useState<string>('0.0.0')
  const [buildNumber, setBuildNumber] = useState<string>('0')
  const [loading, setLoading] = useState<boolean>(true)
  const insets = useSafeAreaInsets()

  useEffect(() => {
    try {
      const appVersion = DeviceInfo.getVersion()
      const appBuildNumber = DeviceInfo.getBuildNumber()
      setVersion(appVersion)
      setBuildNumber(appBuildNumber)
    } catch (_error) {
      setVersion('0.0.0')
      setBuildNumber('0')
    } finally {
      setLoading(false)
    }
  }, [])

  if (!isVisible) {
    return null
  }

  return (
    <View style={[styles.container, { bottom: insets.bottom + spacing.sm }]} testID="version-display">
      <Text style={styles.text}>
        {loading ? '...' : `v${version} (${buildNumber})`}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: spacing.xl,
  },
  text: {
    fontSize: typography.sizeXs,
    color: colors.textMuted,
  },
})
