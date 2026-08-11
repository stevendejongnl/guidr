import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native'
import { VersionDisplay } from '../components/VersionDisplay'
import { SafeScreen } from '../components/SafeScreen'
import { ScreenHeader } from '../components/ScreenHeader'
import { colors, spacing, typography, borderRadius } from '@guidr/shared/tokens'
import { commonStyles } from '@guidr/shared/styles/react-native'
import { IHealthCheckService } from '../../domain/services/IHealthCheckService'
import { NotificationPreferencesStorage } from '../../infrastructure/storage/NotificationPreferencesStorage'
import { NotificationService } from '../../infrastructure/native/NotificationService'
import { AppSettingsStorage } from '../../infrastructure/storage/AppSettingsStorage'
import { Logger } from '../../infrastructure/logging/Logger'

interface SettingsScreenProps {
  onBack: () => void
  onChangeServer: () => void
  onOpenAdmin?: () => void
  isAdmin: boolean
  adminModeActive: boolean
  onToggleAdminMode: (value: boolean) => void
  serverUrl: string | null
  healthCheckService: IHealthCheckService
  notificationPreferencesStorage?: NotificationPreferencesStorage
  notificationService?: NotificationService
  appSettingsStorage?: AppSettingsStorage
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onBack,
  onChangeServer,
  onOpenAdmin,
  isAdmin,
  adminModeActive,
  onToggleAdminMode,
  serverUrl,
  healthCheckService,
  notificationPreferencesStorage: injectedPrefsStorage,
  notificationService: injectedNotifService,
  appSettingsStorage: injectedAppSettingsStorage,
}) => {
  const [serverVersion, setServerVersion] = useState<string | null>(null)
  const [timerNotificationsEnabled, setTimerNotificationsEnabled] = useState(false)
  const [criticalNotificationsEnabled, setCriticalNotificationsEnabled] = useState(true)
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [resettingSettings, setResettingSettings] = useState(false)
  const [resetMessage, setResetMessage] = useState<string | null>(null)

  const prefsStorage = injectedPrefsStorage || new NotificationPreferencesStorage()
  const notifService = injectedNotifService || new NotificationService()
  const appSettingsStorage = injectedAppSettingsStorage || new AppSettingsStorage()

  useEffect(() => {
    const fetchServerVersion = async () => {
      if (serverUrl) {
        try {
          const result = await healthCheckService.validateServer(serverUrl)
          if (result.healthy && result.version) {
            setServerVersion(result.version)
          } else {
            setServerVersion(null)
          }
        } catch {
          setServerVersion(null)
        }
      }
    }
    fetchServerVersion()
  }, [serverUrl, healthCheckService])

  useEffect(() => {
    const loadPreferences = async () => {
      const timerEnabled = await prefsStorage.getTimerNotificationsEnabled()
      const criticalEnabled = await prefsStorage.getCriticalNotificationsEnabled()
      setTimerNotificationsEnabled(timerEnabled)
      setCriticalNotificationsEnabled(criticalEnabled)
    }
    loadPreferences()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleTimerNotificationsToggle = async (value: boolean) => {
    setSavingPrefs(true)
    try {
      setTimerNotificationsEnabled(value)
      await prefsStorage.setTimerNotificationsEnabled(value)
      if (value) {
        await notifService.requestPermission()
      }
      if (!value) {
        setCriticalNotificationsEnabled(false)
        await prefsStorage.setCriticalNotificationsEnabled(false)
      }
    } finally {
      setSavingPrefs(false)
    }
  }

  const handleCriticalNotificationsToggle = async (value: boolean) => {
    setSavingPrefs(true)
    try {
      setCriticalNotificationsEnabled(value)
      await prefsStorage.setCriticalNotificationsEnabled(value)
    } finally {
      setSavingPrefs(false)
    }
  }

  const performReset = async () => {
    setResettingSettings(true)
    setResetMessage(null)
    try {
      await appSettingsStorage.resetToDefaults()
      Logger.setDebugMode(false)

      const [timerEnabled, criticalEnabled] = await Promise.all([
        prefsStorage.getTimerNotificationsEnabled(),
        prefsStorage.getCriticalNotificationsEnabled(),
      ])
      setTimerNotificationsEnabled(timerEnabled)
      setCriticalNotificationsEnabled(criticalEnabled)

      if (timerEnabled) {
        await notifService.requestPermission()
      }

      setResetMessage('Settings reset to defaults')
    } catch (err) {
      setResetMessage(
        err instanceof Error ? err.message : 'Failed to reset settings',
      )
    } finally {
      setResettingSettings(false)
    }
  }

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings to Defaults',
      'This resets notification, debug, and other device-local settings on this device. Your account, server connection, and data are not affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: performReset,
        },
      ],
    )
  }

  return (
    <SafeScreen>
      <View style={commonStyles.containerTop}>
        <ScreenHeader onBack={onBack} title="Settings" backTestID="settings-back-button" />

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Server Section */}
          <View style={commonStyles.section}>
            <Text style={commonStyles.sectionTitle}>Server</Text>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Server URL</Text>
              <Text style={styles.settingValueSmall} numberOfLines={1}>
                {serverUrl || 'Not configured'}
              </Text>
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Server Version</Text>
              <Text style={styles.settingValue}>
                {serverVersion || 'Not available'}
              </Text>
            </View>
            <TouchableOpacity
              style={[commonStyles.buttonSecondary, styles.sectionButton]}
              onPress={onChangeServer}
              testID="change-server-button"
            >
              <Text style={commonStyles.buttonText}>Change Server</Text>
            </TouchableOpacity>
          </View>

          {/* Notifications Section */}
          <View style={commonStyles.section}>
            <Text style={commonStyles.sectionTitle}>Notifications</Text>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Timer Notifications</Text>
              <Switch
                value={timerNotificationsEnabled}
                onValueChange={handleTimerNotificationsToggle}
                disabled={savingPrefs}
                testID="timer-notifications-toggle"
              />
            </View>
            <Text style={styles.settingHint}>
              Get notified when step timers complete
            </Text>
            {timerNotificationsEnabled && (
              <>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Time-Sensitive</Text>
                  <Switch
                    value={criticalNotificationsEnabled}
                    onValueChange={handleCriticalNotificationsToggle}
                    disabled={savingPrefs}
                    testID="critical-notifications-toggle"
                  />
                </View>
                <Text style={styles.settingHint}>
                  Break through Focus and Do Not Disturb modes
                </Text>
              </>
            )}
          </View>

          {/* Device Settings Section */}
          <View style={commonStyles.section}>
            <Text style={commonStyles.sectionTitle}>Device Settings</Text>
            <Text style={styles.settingHint}>
              Reset notification, debug, and other settings stored on this
              device back to defaults. Your account, server connection, and
              data are not affected.
            </Text>
            <TouchableOpacity
              style={[styles.dangerButton, resettingSettings ? styles.buttonDisabled : null]}
              onPress={handleResetSettings}
              disabled={resettingSettings}
              accessibilityLabel="Reset settings to defaults"
              testID="reset-settings-button"
            >
              <Text style={commonStyles.buttonText}>Reset Settings to Defaults</Text>
            </TouchableOpacity>
            {resetMessage && (
              <Text style={commonStyles.successText}>{resetMessage}</Text>
            )}
          </View>

          {/* Admin Section - Shown when user has admin privileges */}
          {isAdmin && (
            <View style={commonStyles.section}>
              <Text style={commonStyles.sectionTitle}>Admin</Text>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Admin Mode</Text>
                <Switch
                  value={adminModeActive}
                  onValueChange={onToggleAdminMode}
                  testID="admin-mode-toggle"
                />
              </View>
              {adminModeActive && onOpenAdmin && (
                <TouchableOpacity
                  style={[commonStyles.buttonSecondary, styles.sectionButton]}
                  onPress={onOpenAdmin}
                  testID="open-admin-button"
                >
                  <Text style={commonStyles.buttonText}>Admin Tools</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>

        <VersionDisplay isVisible={isAdmin} />
      </View>
    </SafeScreen>
  )
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  settingLabel: {
    fontSize: typography.sizeMd,
    color: colors.textSecondary,
  },
  settingValue: {
    fontSize: typography.sizeMd,
    color: colors.textPrimary,
    fontWeight: typography.weightMedium,
  },
  settingValueSmall: {
    fontSize: typography.sizeSm,
    color: colors.textPrimary,
    maxWidth: 180,
  },
  settingHint: {
    fontSize: typography.sizeSm,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  sectionButton: {
    marginTop: spacing.md,
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
})
