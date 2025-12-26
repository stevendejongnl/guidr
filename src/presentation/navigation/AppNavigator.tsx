import React, { useEffect, useState } from 'react'
import { ActivityIndicator, View, StyleSheet } from 'react-native'
import { ServerConfigStorage } from '../../infrastructure/storage/ServerConfigStorage'
import { AuthStorage } from '../../infrastructure/storage/AuthStorage'
import { AuthClient } from '../../infrastructure/api/AuthClient'
import { ServerSetupScreen } from '../screens/ServerSetupScreen'
import { LoginScreen } from '../screens/LoginScreen'
import { HomeScreen } from '../screens/HomeScreen'

export const AppNavigator: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [hasServerUrl, setHasServerUrl] = useState(false)
  const [hasAuthToken, setHasAuthToken] = useState(false)
  const [serverUrl, setServerUrl] = useState<string | null>(null)

  const serverStorage = new ServerConfigStorage()
  const authStorage = new AuthStorage()

  useEffect(() => {
    const checkConfiguration = async () => {
      try {
        const hasUrl = await serverStorage.hasServerUrl()
        setHasServerUrl(hasUrl)

        if (hasUrl) {
          const url = await serverStorage.getServerUrl()
          setServerUrl(url)

          const hasToken = await authStorage.hasAuthToken()
          setHasAuthToken(hasToken)
        }
      } catch (error) {
        console.error('Failed to check configuration:', error)
      } finally {
        setLoading(false)
      }
    }

    checkConfiguration()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleServerSetupComplete = async () => {
    const url = await serverStorage.getServerUrl()
    setServerUrl(url)
    setHasServerUrl(true)
  }

  const handleLoginComplete = () => {
    setHasAuthToken(true)
  }

  const handleLogout = async () => {
    await authStorage.clearAll()
    setHasAuthToken(false)
  }

  const handleChangeServer = async () => {
    await authStorage.clearAll()
    await serverStorage.clearServerUrl()
    setHasAuthToken(false)
    setHasServerUrl(false)
    setServerUrl(null)
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196f3" />
      </View>
    )
  }

  if (!hasServerUrl) {
    return <ServerSetupScreen storage={serverStorage} onComplete={handleServerSetupComplete} />
  }

  if (!hasAuthToken && serverUrl) {
    const authClient = new AuthClient(serverUrl)
    return (
      <LoginScreen
        authStorage={authStorage}
        authClient={authClient}
        onComplete={handleLoginComplete}
        onChangeServer={handleChangeServer}
      />
    )
  }

  return <HomeScreen onLogout={handleLogout} />
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
})
