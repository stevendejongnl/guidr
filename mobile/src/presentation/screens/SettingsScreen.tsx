import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
} from 'react-native'
import { VersionDisplay } from '../components/VersionDisplay'
import { SafeScreen } from '../components/SafeScreen'
import { colors, spacing, typography, borderRadius } from '@guidr/shared/tokens'
import { commonStyles } from '@guidr/shared/styles/react-native'
import { IHealthCheckService } from '../../domain/services/IHealthCheckService'
import { NotificationPreferencesStorage } from '../../infrastructure/storage/NotificationPreferencesStorage'
import { NotificationService } from '../../infrastructure/native/NotificationService'

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
}) => {
  const [serverVersion, setServerVersion] = useState<string | null>(null)
  const [timerNotificationsEnabled, setTimerNotificationsEnabled] = useState(true)
  const [criticalNotificationsEnabled, setCriticalNotificationsEnabled] = useState(false)

  const prefsStorage = injectedPrefsStorage || new NotificationPreferencesStorage()
  const notifService = injectedNotifService || new NotificationService()

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
    setTimerNotificationsEnabled(value)
    await prefsStorage.setTimerNotificationsEnabled(value)
    if (value) {
      await notifService.requestPermission()
    }
    if (!value) {
      setCriticalNotificationsEnabled(false)
      await prefsStorage.setCriticalNotificationsEnabled(false)
    }
  }

  const handleCriticalNotificationsToggle = async (value: boolean) => {
    setCriticalNotificationsEnabled(value)
    await prefsStorage.setCriticalNotificationsEnabled(value)
  }

  return (
    <SafeScreen>
      <View style={commonStyles.containerTop}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            accessibilityLabel="Go back"
            testID="settings-back-button"
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.headerSpacer} />
        </View>

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
                    testID="critical-notifications-toggle"
                  />
                </View>
                <Text style={styles.settingHint}>
                  Break through Focus and Do Not Disturb modes
                </Text>
              </>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.sizeXl,
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 80, // Match back button width for centering
  },
  backButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  backButtonText: {
    fontSize: typography.sizeMd,
    color: colors.primary,
    fontWeight: typography.weightMedium,
  },
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
})
