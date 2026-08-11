import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native'
import { VersionDisplay } from '../components/VersionDisplay'
import { SafeScreen } from '../components/SafeScreen'
import { MarkdownText } from '../components/MarkdownText'
import {
  colors,
  spacing,
  typography,
  borderRadius,
} from '@guidr/shared/tokens'
import { commonStyles } from '@guidr/shared/styles/react-native'

interface UpdateAvailableScreenProps {
  currentVersion: string
  latestVersion: string
  changelog: string
  isMandatory: boolean
  onStartUpdate: () => void
  onDismiss?: () => void
  onChangeServer?: () => void
}

export const UpdateAvailableScreen: React.FC<UpdateAvailableScreenProps> = ({
  currentVersion,
  latestVersion,
  changelog,
  isMandatory,
  onStartUpdate,
  onDismiss,
  onChangeServer,
}) => {
  const getTitle = () => {
    return isMandatory ? 'Update Required' : 'Update Available'
  }

  return (
    <SafeScreen>
      <View style={commonStyles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
          <Text style={styles.title}>{getTitle()}</Text>

          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>
            v{currentVersion} → v{latestVersion}
            </Text>
          </View>

          {changelog && (
            <View style={styles.changelogContainer}>
              <Text style={styles.changelogTitle}>{'What\'s New:'}</Text>
              <View style={styles.changelogBox}>
                <MarkdownText>{changelog}</MarkdownText>
              </View>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.updateButton}
              onPress={onStartUpdate}
              accessibilityLabel={
                isMandatory ? 'Update now' : 'Start update'
              }
            >
              <Text style={commonStyles.buttonText}>
                {isMandatory ? 'Update Now' : 'Update'}
              </Text>
            </TouchableOpacity>

            {!isMandatory && onDismiss && (
              <TouchableOpacity
                style={commonStyles.buttonOutline}
                onPress={onDismiss}
                accessibilityLabel="Dismiss update"
              >
                <Text style={commonStyles.buttonTextMuted}>Later</Text>
              </TouchableOpacity>
            )}

            {onChangeServer && (
              <TouchableOpacity
                style={styles.changeServerButton}
                onPress={onChangeServer}
                accessibilityLabel="Change server"
              >
                <Text style={styles.changeServerText}>Change Server</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
        <VersionDisplay />
      </View>
    </SafeScreen>
  )
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    alignSelf: 'stretch',
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontSize: typography.sizeXxl,
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  versionContainer: {
    marginBottom: spacing.xl,
  },
  versionText: {
    fontSize: typography.sizeLg,
    color: colors.primary,
    fontWeight: typography.weightSemibold,
    textAlign: 'center',
  },
  changelogContainer: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  changelogTitle: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  changelogBox: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  buttonContainer: {
    width: '100%',
    gap: spacing.md,
  },
  updateButton: {
    backgroundColor: colors.buttonPrimary,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.xxxl,
    width: '100%',
    alignItems: 'center',
  },
  changeServerButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  changeServerText: {
    fontSize: typography.sizeSm,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
})
