import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { colors, spacing, typography, borderRadius, componentDefaults } from '../theme'
import { HomeScreenMockData, MockSession, SessionStatus } from '../../infrastructure/mocks/HomeScreenMockData'
import { NodeProgressIndicator } from './NodeProgressIndicator'
import { StatusBadge } from './StatusBadge'

interface ActivityItemProps {
  session: MockSession
  onResume?: () => void
  testID?: string
}

export const ActivityItem: React.FC<ActivityItemProps> = ({ session, onResume, testID }) => {
  const isActive = session.status === SessionStatus.InProgress || session.status === SessionStatus.Paused
  const relativeTime = HomeScreenMockData.formatRelativeTime(session.startedAt)

  // Convert status to badge status type
  const getStatusForBadge = (): 'completed' | 'in-progress' | 'paused' | 'not-started' => {
    switch (session.status) {
      case SessionStatus.Completed:
        return 'completed'
      case SessionStatus.InProgress:
        return 'in-progress'
      case SessionStatus.Paused:
        return 'paused'
      default:
        return 'not-started'
    }
  }

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.guideTitle}>{session.guideTitle}</Text>
          <View style={styles.metaRow}>
            <StatusBadge status={getStatusForBadge()} variant="solid" testID={`${testID}:status`} />
            <Text style={styles.time}>{relativeTime}</Text>
          </View>
        </View>
      </View>

      {session.currentStepTitle && (
        <Text style={styles.currentStep}>{session.currentStepTitle}</Text>
      )}

      {isActive && (
        <>
          {/* Node Progress Indicator */}
          {session.currentStep !== undefined && session.totalSteps !== undefined && session.totalSteps > 0 && (
            <View style={styles.progressSection}>
              <NodeProgressIndicator
                currentStep={session.currentStep}
                totalSteps={session.totalSteps}
                variant="compact"
                testID={`${testID}:progress`}
              />
              <Text style={styles.progressText}>{session.progress}%</Text>
            </View>
          )}

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
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: componentDefaults.cardPadding,
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
    marginBottom: spacing.md,
  },
  progressText: {
    fontSize: typography.sizeSm,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: spacing.sm,
  },
  resumeButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  resumeText: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.textPrimary,
  },
})
