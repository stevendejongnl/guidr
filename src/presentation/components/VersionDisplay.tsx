import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import DeviceInfo from 'react-native-device-info'

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
    } catch (error) {
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
    bottom: 20,
    right: 20,
  },
  text: {
    fontSize: 12,
    color: '#999',
  },
})
