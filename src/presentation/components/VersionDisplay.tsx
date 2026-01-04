import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import { colors, spacing, typography } from '../theme'

export const VersionDisplay: React.FC = () => {
  const [version, setVersion] = useState<string>('0.0.0')
  const [buildNumber, setBuildNumber] = useState<string>('0')
  const [loading, setLoading] = useState<boolean>(true)

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

  return (
    <View style={styles.container} testID="version-display">
      <Text style={styles.text}>
        {loading ? '...' : `v${version} (${buildNumber})`}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
  },
  text: {
    fontSize: typography.sizeXs,
    color: colors.textMuted,
  },
})
