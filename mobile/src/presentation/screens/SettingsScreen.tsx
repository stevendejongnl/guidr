import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native'
import { VersionDisplay } from '../components/VersionDisplay'
import { SafeScreen } from '../components/SafeScreen'
import { commonStyles, colors, spacing, typography, borderRadius } from '../theme'
import { IHealthCheckService } from '../../domain/services/IHealthCheckService'

interface SettingsScreenProps {
  onBack: () => void
  onChangeServer: () => void
  onOpenAdmin?: () => void
  adminMode: boolean
  serverUrl: string | null
  healthCheckService: IHealthCheckService
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onBack,
  onChangeServer,
  onOpenAdmin,
  adminMode,
  serverUrl,
  healthCheckService,
}) => {
  const [serverVersion, setServerVersion] = useState<string | null>(null)

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

          {/* Admin Section - Only shown in admin mode */}
          {adminMode && onOpenAdmin && (
            <View style={commonStyles.section}>
              <Text style={commonStyles.sectionTitle}>Admin</Text>
              <TouchableOpacity
                style={[commonStyles.buttonSecondary, styles.sectionButton]}
                onPress={onOpenAdmin}
                testID="open-admin-button"
              >
                <Text style={commonStyles.buttonText}>Admin Tools</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        <VersionDisplay isVisible={adminMode} />
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
  sectionButton: {
    marginTop: spacing.md,
  },
})
