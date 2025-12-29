import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import DeviceInfo from 'react-native-device-info'
import { ServerConfigStorage } from '../../infrastructure/storage/ServerConfigStorage'
import { AuthStorage } from '../../infrastructure/storage/AuthStorage'
import { VersionDisplay } from '../components/VersionDisplay'

interface DebugScreenProps {
  onBack: () => void
  serverUrl: string
}

export const DebugScreen: React.FC<DebugScreenProps> = ({
  onBack,
  serverUrl: serverUrlProp,
}) => {
  const [storedServerUrl, setStoredServerUrl] = useState<string | null>(null)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [pingResult, setPingResult] = useState<string | null>(null)
  const [appVersion, setAppVersion] = useState('0.0.0')
  const [appBuildNumber, setAppBuildNumber] = useState('0')
  const [serverVersion, setServerVersion] = useState<string | null>(null)

  useEffect(() => {
    loadStoredConfig()
    loadVersionInfo()
  }, [])

  const loadStoredConfig = async () => {
    try {
      const serverConfigStorage = new ServerConfigStorage()
      const authStorage = new AuthStorage()

      const url = await serverConfigStorage.getServerUrl()
      const token = await authStorage.getAuthToken()
      const email = await authStorage.getUserEmail()

      setStoredServerUrl(url)
      setAuthToken(token)
      setUserEmail(email)
    } catch (err) {
      console.error('Failed to load stored config:', err)
    }
  }

  const loadVersionInfo = () => {
    try {
      const appVer = DeviceInfo.getVersion()
      const buildNum = DeviceInfo.getBuildNumber()
      setAppVersion(appVer)
      setAppBuildNumber(buildNum)
    } catch (error) {
      console.error('Failed to load version info:', error)
    }
  }

  const handleClearCache = async () => {
    setLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      await AsyncStorage.clear()
      setSuccessMessage('Cache cleared successfully')
      // Reload stored values to reflect cleared state
      await loadStoredConfig()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear cache')
    } finally {
      setLoading(false)
    }
  }

  const handleConnectionTest = async () => {
    setLoading(true)
    setError('')
    setPingResult(null)
    setSuccessMessage('')

    try {
      const url = storedServerUrl || serverUrlProp
      if (!url) {
        throw new Error('No server URL configured')
      }

      const startTime = Date.now()
      const response = await fetch(`${url}/`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      const endTime = Date.now()

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`)
      }

      const data = await response.json()
      const responseTime = endTime - startTime

      setPingResult(`✓ Connected (${responseTime}ms)`)
      setServerVersion(data.version || 'unknown')
    } catch (err) {
      setPingResult('✗ Connection failed')
      setError(err instanceof Error ? err.message : 'Connection test failed')
    } finally {
      setLoading(false)
    }
  }

  const maskToken = (token: string | null): string => {
    if (!token) return 'None'
    if (token.length <= 8) return token
    return '***' + token.slice(-8)
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          accessibilityLabel="Go back"
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Debug Tools</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Version Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Version Information</Text>
          <Text style={styles.infoText}>App: v{appVersion} ({appBuildNumber})</Text>
          <Text style={styles.infoText}>
            Server: {serverVersion || 'Not connected'}
          </Text>
        </View>

        {/* Stored Configuration Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stored Configuration</Text>
          <Text style={styles.infoText}>
            Server URL: {storedServerUrl || 'None'}
          </Text>
          <Text style={styles.infoText}>
            Auth Token: {maskToken(authToken)}
          </Text>
          <Text style={styles.infoText}>
            Email: {userEmail || 'None'}
          </Text>
        </View>

        {/* Connection Test Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connection Test</Text>
          <TouchableOpacity
            style={[styles.button, loading ? styles.buttonDisabled : null]}
            onPress={handleConnectionTest}
            disabled={loading}
            accessibilityLabel="Test server connection"
          >
            <Text style={styles.buttonText}>Test Connection</Text>
          </TouchableOpacity>
          {pingResult && (
            <Text style={[
              styles.infoText,
              pingResult.startsWith('✓') ? styles.successText : styles.warningText
            ]}>
              {pingResult}
            </Text>
          )}
        </View>

        {/* Clear Cache Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cache Management</Text>
          <Text style={styles.warningText}>
            Warning: This will clear all app data including server URL and authentication.
          </Text>
          <TouchableOpacity
            style={[styles.dangerButton, loading ? styles.buttonDisabled : null]}
            onPress={handleClearCache}
            disabled={loading}
            accessibilityLabel="Clear all cache"
          >
            <Text style={styles.buttonText}>Clear All Cache</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <ActivityIndicator size="large" color="#2196f3" style={styles.loader} />
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}
        {successMessage && <Text style={styles.successText}>{successMessage}</Text>}
      </ScrollView>
      <VersionDisplay />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginBottom: 8,
  },
  backButtonText: {
    color: '#2196f3',
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#2196f3',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 8,
    alignItems: 'center',
  },
  dangerButton: {
    backgroundColor: '#f44336',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loader: {
    marginVertical: 16,
  },
  errorText: {
    color: '#f44336',
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
  },
  successText: {
    color: '#4caf50',
    fontSize: 14,
    marginTop: 8,
  },
  warningText: {
    color: '#ff9800',
    fontSize: 14,
    marginBottom: 8,
  },
})
