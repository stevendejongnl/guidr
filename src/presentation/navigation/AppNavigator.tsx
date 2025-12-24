import React, { useEffect, useState } from 'react'
import { ActivityIndicator, View, StyleSheet } from 'react-native'
import { ServerConfigStorage } from '../../infrastructure/storage/ServerConfigStorage'
import { ServerSetupScreen } from '../screens/ServerSetupScreen'
import { HomeScreen } from '../screens/HomeScreen'

export const AppNavigator: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [hasServerUrl, setHasServerUrl] = useState(false)
  const storage = new ServerConfigStorage()

  useEffect(() => {
    checkServerConfig()
  }, [])

  const checkServerConfig = async () => {
    try {
      const hasUrl = await storage.hasServerUrl()
      setHasServerUrl(hasUrl)
    } catch (error) {
      console.error('Failed to check server config:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSetupComplete = () => {
    setHasServerUrl(true)
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196f3" />
      </View>
    )
  }

  if (!hasServerUrl) {
    return <ServerSetupScreen storage={storage} onComplete={handleSetupComplete} />
  }

  return <HomeScreen />
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
})
