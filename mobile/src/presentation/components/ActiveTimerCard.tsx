import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { colors, spacing, typography } from '@guidr/shared/tokens'
import { StatusBadge } from './StatusBadge'
import { ActiveTimerItem } from '../hooks/useActiveTimers'

interface ActiveTimerCardProps {
  timer: ActiveTimerItem
  onPress: () => void
}

const formatTime = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`
  }
  return `${pad(mins)}:${pad(secs)}`
}

export const ActiveTimerCard: React.FC<ActiveTimerCardProps> = ({ timer, onPress }) => {
  const badgeStatus = timer.display.isRunning ? 'in-progress' : 'paused'

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      testID={`active-timer-${timer.timerId}`}
    >
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.guideTitle} numberOfLines={1}>
            {timer.guideTitle}
          </Text>
          <StatusBadge status={badgeStatus} />
        </View>
        <Text style={styles.stepTitle} numberOfLines={1}>
          {timer.stepTitle}
        </Text>
      </View>
      <Text style={styles.timerValue}>{formatTime(timer.display.displaySeconds)}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  content: {
    flex: 1,
    marginRight: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  guideTitle: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  stepTitle: {
    fontSize: typography.sizeSm,
    color: colors.textSecondary,
  },
  timerValue: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
})
