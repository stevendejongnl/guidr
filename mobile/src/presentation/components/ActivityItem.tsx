import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { colors, spacing, typography } from '../theme'
import { HomeScreenMockData, MockSession, SessionStatus } from '../../infrastructure/mocks/HomeScreenMockData'

interface ActivityItemProps {
  session: MockSession
  onResume?: () => void
  testID?: string
}

export const ActivityItem: React.FC<ActivityItemProps> = ({ session, onResume, testID }) => {
  const isActive = session.status === SessionStatus.InProgress || session.status === SessionStatus.Paused
  const statusColor = HomeScreenMockData.getStatusColor(session.status)
  const statusLabel = HomeScreenMockData.getStatusLabel(session.status)
  const relativeTime = HomeScreenMockData.formatRelativeTime(session.startedAt)

  const getStatusStyle = () => {
    const baseStyle = styles.badge
    const colorMap = {
      primary: { backgroundColor: colors.primary },
      success: { backgroundColor: colors.success },
      warning: { backgroundColor: colors.warning },
      textMuted: { backgroundColor: colors.textMuted },
    }
    return [baseStyle, colorMap[statusColor]]
  }

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.guideTitle}>{session.guideTitle}</Text>
          <View style={styles.metaRow}>
            <View style={getStatusStyle()}>
              <Text style={styles.badgeText}>{statusLabel}</Text>
            </View>
            <Text style={styles.time}>{relativeTime}</Text>
          </View>
        </View>
      </View>

      {session.currentStepTitle && (
        <Text style={styles.currentStep}>{session.currentStepTitle}</Text>
      )}

      {isActive && (
        <>
          <View style={styles.progressSection}>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${session.progress}%` },
                ]}
                testID="progress-bar"
              />
            </View>
            <Text style={styles.progressText}>{session.progress}%</Text>
          </View>

          {onResume && (
            <TouchableOpacity style={styles.resumeButton} onPress={onResume}>
              <Text style={styles.resumeText}>Resume →</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleSection: {
    flex: 1,
  },
  guideTitle: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  badge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.textPrimary,
  },
  time: {
    fontSize: typography.sizeSm,
    color: colors.textSecondary,
  },
  currentStep: {
    fontSize: typography.sizeSm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  progressSection: {
    marginTop: spacing.md,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressText: {
    fontSize: typography.sizeSm,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  resumeButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: 6,
    alignItems: 'center',
  },
  resumeText: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.textPrimary,
  },
})
