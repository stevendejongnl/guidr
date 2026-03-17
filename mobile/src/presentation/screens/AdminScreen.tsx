import React, { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  Share,
  Switch,
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
import { colors, spacing, typography, borderRadius } from '@guidr/shared/tokens'
import { commonStyles } from '@guidr/shared/styles/react-native'
import { DiagnosticLogService } from '../../infrastructure/native/DiagnosticLogService'
import { DebugModeStorage } from '../../infrastructure/storage/DebugModeStorage'
import { Logger } from '../../infrastructure/logging/Logger'

interface AdminScreenProps {
  onBack: () => void
  serverUrl: string
  healthCheckService: IHealthCheckService
  // Optional dependencies (for testing/DI)
  serverConfigStorage?: ServerConfigStorage
  authStorage?: AuthStorage
}

export const AdminScreen: React.FC<AdminScreenProps> = ({
  onBack,
  serverUrl: serverUrlProp,
  healthCheckService,
  serverConfigStorage: injectedServerConfigStorage,
  authStorage: injectedAuthStorage,
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
  const [logEntries, setLogEntries] = useState<string[]>([])
  const [logLoading, setLogLoading] = useState(false)
  const [debugMode, setDebugMode] = useState(Logger.isDebugMode())

  const loadStoredConfig = useCallback(async () => {
    try {
      const serverConfigStorage = injectedServerConfigStorage ?? new ServerConfigStorage()
      const authStorage = injectedAuthStorage ?? new AuthStorage()

      const url = await serverConfigStorage.getServerUrl()
      const token = await authStorage.getAuthToken()
      const email = await authStorage.getUserEmail()

      setStoredServerUrl(url)
      setAuthToken(token)
      setUserEmail(email)
    } catch (err) {
      console.error('Failed to load stored config:', err)
    }
  }, [injectedServerConfigStorage, injectedAuthStorage])

  useEffect(() => {
    loadStoredConfig()
    loadVersionInfo()
    loadDiagnosticLog()
  }, [loadStoredConfig])

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

  const handleClearCache = () => {
    Alert.alert(
      'Clear All Cache',
      'This will delete all app data including your server URL and login. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
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
          },
        },
      ],
    )
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

  const loadDiagnosticLog = async () => {
    setLogLoading(true)
    try {
      const entries = await new DiagnosticLogService().getEntries()
      setLogEntries(entries)
    } catch (err) {
      console.error('Failed to load diagnostic log:', err)
    } finally {
      setLogLoading(false)
    }
  }

  const handleShareLog = async () => {
    try {
      await Share.share({
        message: logEntries.join('\n'),
        title: 'Guidr Diagnostic Log',
      })
    } catch (err) {
      console.error('Failed to share log:', err)
    }
  }

  const handleClearLog = async () => {
    try {
      await new DiagnosticLogService().clear()
      await loadDiagnosticLog()
    } catch (err) {
      console.error('Failed to clear log:', err)
    }
  }

  const handleDebugModeToggle = async (enabled: boolean) => {
    setDebugMode(enabled)
    Logger.setDebugMode(enabled)
    await new DebugModeStorage().setDebugMode(enabled)
    Logger.info('AdminScreen', `Debug mode ${enabled ? 'enabled' : 'disabled'}`)
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

          {/* Debug Logging Section */}
          <View style={commonStyles.section}>
            <Text style={commonStyles.sectionTitle}>Debug Logging</Text>
            <View style={styles.toggleRow}>
              <View style={styles.toggleLabel}>
                <Text style={styles.infoText}>Verbose debug logs</Text>
                <Text style={styles.toggleSubtext}>
                  {debugMode
                    ? 'All events logged — visible in diagnostics below'
                    : 'Only warnings and errors are logged'}
                </Text>
              </View>
              <Switch
                value={debugMode}
                onValueChange={handleDebugModeToggle}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.surface}
              />
            </View>
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

          {/* Live Activity Diagnostics Section */}
          <View style={commonStyles.section}>
            <Text style={commonStyles.sectionTitle}>Live Activity Diagnostics</Text>
            <TouchableOpacity
              style={[styles.button, logLoading ? styles.buttonDisabled : null]}
              onPress={loadDiagnosticLog}
              disabled={logLoading}
              accessibilityLabel="Refresh diagnostic log"
            >
              <Text style={commonStyles.buttonText}>Refresh Log</Text>
            </TouchableOpacity>
            {logLoading && (
              <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
            )}
            {!logLoading && logEntries.length === 0 && (
              <Text style={styles.infoText}>No log entries</Text>
            )}
            {!logLoading && logEntries.length > 0 && (
              <ScrollView
                style={styles.logScrollView}
                nestedScrollEnabled
              >
                {logEntries.map((entry, index) => (
                  <Text key={index} style={styles.logEntry}>
                    {entry}
                  </Text>
                ))}
              </ScrollView>
            )}
            {logEntries.length > 0 && (
              <TouchableOpacity
                style={styles.button}
                onPress={handleShareLog}
                accessibilityLabel="Share diagnostic log"
              >
                <Text style={commonStyles.buttonText}>Share Log</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.dangerButton}
              onPress={handleClearLog}
              accessibilityLabel="Clear diagnostic log"
            >
              <Text style={commonStyles.buttonText}>Clear Log</Text>
            </TouchableOpacity>
          </View>
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  toggleLabel: {
    flex: 1,
    marginRight: spacing.md,
  },
  toggleSubtext: {
    fontSize: typography.sizeXs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  logScrollView: {
    height: 300,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logEntry: {
    fontSize: 10,
    color: colors.textSecondary,
    fontFamily: 'Courier',
    marginBottom: 2,
  },
})
