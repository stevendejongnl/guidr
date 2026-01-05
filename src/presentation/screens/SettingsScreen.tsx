import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native'
import DeviceInfo from 'react-native-device-info'
import { VersionDisplay } from '../components/VersionDisplay'
import { SafeScreen } from '../components/SafeScreen'
import { commonStyles, colors, spacing, typography, borderRadius } from '../theme'

interface SettingsScreenProps {
  onBack: () => void
  onChangeServer: () => void
  onOpenDebug?: () => void
  onOpenProfile: () => void
  debugMode: boolean
  serverUrl: string | null
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onBack,
  onChangeServer,
  onOpenDebug,
  onOpenProfile,
  debugMode,
  serverUrl,
}) => {
  const appVersion = DeviceInfo.getVersion()
  const buildNumber = DeviceInfo.getBuildNumber()

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
          {/* App Information Section */}
          <View style={commonStyles.section}>
            <Text style={commonStyles.sectionTitle}>App Information</Text>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Version</Text>
              <Text style={styles.settingValue}>{appVersion}</Text>
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Build</Text>
              <Text style={styles.settingValue}>{buildNumber}</Text>
            </View>
          </View>

          {/* Server Section */}
          <View style={commonStyles.section}>
            <Text style={commonStyles.sectionTitle}>Server</Text>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Server URL</Text>
              <Text style={styles.settingValueSmall} numberOfLines={1}>
                {serverUrl || 'Not configured'}
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

          {/* Account Section */}
          <View style={commonStyles.section}>
            <Text style={commonStyles.sectionTitle}>Account</Text>
            <TouchableOpacity
              style={[commonStyles.buttonSecondary, styles.sectionButton]}
              onPress={onOpenProfile}
              testID="open-profile-button"
            >
              <Text style={commonStyles.buttonText}>My Profile & Account</Text>
            </TouchableOpacity>
          </View>

          {/* Debug Section - Only shown in debug mode */}
          {debugMode && onOpenDebug && (
            <View style={commonStyles.section}>
              <Text style={commonStyles.sectionTitle}>Developer</Text>
              <TouchableOpacity
                style={[commonStyles.buttonSecondary, styles.sectionButton]}
                onPress={onOpenDebug}
                testID="open-debug-button"
              >
                <Text style={commonStyles.buttonText}>Debug Tools</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        <VersionDisplay />
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
