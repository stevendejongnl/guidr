import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import DeviceInfo from 'react-native-device-info'
import { ServerConfigStorage } from '../../infrastructure/storage/ServerConfigStorage'
import { AuthStorage } from '../../infrastructure/storage/AuthStorage'
import { ServerConfigCache } from '../../infrastructure/storage/ServerConfigCache'
import { IHealthCheckService } from '../../domain/services/IHealthCheckService'
import { VersionDisplay } from '../components/VersionDisplay'
import { SafeScreen } from '../components/SafeScreen'
import { UpdateButton } from '../components/UpdateButton'
import { UpdateCheckResult } from '../../domain/services/UpdateService'
import { commonStyles, colors, spacing, typography, borderRadius } from '../theme'

interface AdminScreenProps {
  onBack: () => void
  serverUrl: string
  healthCheckService: IHealthCheckService
}

export const AdminScreen: React.FC<AdminScreenProps> = ({
  onBack,
  serverUrl: serverUrlProp,
  healthCheckService,
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

      const result = await healthCheckService.validateServer(url)

      if (result.healthy) {
        setPingResult(`✓ Connected (${result.responseTime}ms)`)
        setSuccessMessage(`Successfully connected to: ${url}/api/v1/health`)
        setServerVersion(result.version || 'Not available')
      } else {
        setPingResult('✗ Connection failed')
        setError(`${result.error || 'Connection test failed'}\n\nTested URL: ${url}/api/v1/health`)
      }
    } catch (err) {
      setPingResult('✗ Connection failed')
      const url = storedServerUrl || serverUrlProp
      const urlInfo = url ? `\n\nTested URL: ${url}/api/v1/health` : ''
      setError((err instanceof Error ? err.message : 'Connection test failed') + urlInfo)
    } finally {
      setLoading(false)
    }
  }

  const maskToken = (token: string | null): string => {
    if (!token) return 'None'
    if (token.length <= 8) return token
    return '***' + token.slice(-8)
  }

  const handleUpdateCheckComplete = (result: UpdateCheckResult) => {
    if (result.updateAvailable) {
      console.log('Update available:', result.latestVersion)
      // The UpdateButton component will display the message
    }
  }

  return (
    <SafeScreen>
      <View style={commonStyles.containerTop}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            accessibilityLabel="Go back"
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={commonStyles.title}>Admin Tools</Text>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Version Info Section */}
          <View style={commonStyles.section}>
            <Text style={commonStyles.sectionTitle}>Version Information</Text>
            <Text style={styles.infoText}>App: v{appVersion} ({appBuildNumber})</Text>
            <Text style={styles.infoText}>
              Server: {serverVersion || 'Not connected'}
            </Text>
          </View>

          {/* Stored Configuration Section */}
          <View style={commonStyles.section}>
            <Text style={commonStyles.sectionTitle}>Stored Configuration</Text>
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
          <View style={commonStyles.section}>
            <Text style={commonStyles.sectionTitle}>Connection Test</Text>
            <TouchableOpacity
              style={[styles.button, loading ? styles.buttonDisabled : null]}
              onPress={handleConnectionTest}
              disabled={loading}
              accessibilityLabel="Test server connection"
            >
              <Text style={commonStyles.buttonText}>Test Connection</Text>
            </TouchableOpacity>
            {pingResult && (
              <Text style={[
                styles.infoText,
                pingResult.startsWith('✓') ? commonStyles.successText : commonStyles.warningText
              ]}>
                {pingResult}
              </Text>
            )}
          </View>

          {/* Update Check Section (Android only) */}
          {Platform.OS === 'android' && (
            <View style={commonStyles.section}>
              <Text style={commonStyles.sectionTitle}>App Updates</Text>
              <UpdateButton
                serverConfig={ServerConfigCache.getConfig() || {}}
                onCheckComplete={handleUpdateCheckComplete}
              />
            </View>
          )}

          {/* Clear Cache Section */}
          <View style={commonStyles.section}>
            <Text style={commonStyles.sectionTitle}>Cache Management</Text>
            <Text style={commonStyles.warningText}>
              Warning: This will clear all app data including server URL and authentication.
            </Text>
            <TouchableOpacity
              style={[styles.dangerButton, loading ? styles.buttonDisabled : null]}
              onPress={handleClearCache}
              disabled={loading}
              accessibilityLabel="Clear all cache"
            >
              <Text style={commonStyles.buttonText}>Clear All Cache</Text>
            </TouchableOpacity>
          </View>

          {loading && (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          )}

          {error && <Text style={styles.errorText}>{error}</Text>}
          {successMessage && <Text style={commonStyles.successText}>{successMessage}</Text>}
        </ScrollView>
        <VersionDisplay />
      </View>
    </SafeScreen>
  )
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginBottom: spacing.sm,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: typography.sizeMd,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  infoText: {
    fontSize: typography.sizeSm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  button: {
    backgroundColor: colors.buttonPrimary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  dangerButton: {
    backgroundColor: colors.danger,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  loader: {
    marginVertical: spacing.lg,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.sizeSm,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
})
