import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { colors, spacing, typography } from '../theme'
import { MockGuide } from '../../infrastructure/mocks/HomeScreenMockData'

interface GuideCardProps {
  guide: MockGuide
  onPress?: () => void
  testID?: string
}

export const GuideCard: React.FC<GuideCardProps> = ({ guide, onPress, testID }) => {
  const durationDisplay = guide.duration < 60
    ? `${guide.duration} min`
    : `${Math.floor(guide.duration / 60)}h ${guide.duration % 60}m`

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      testID={testID}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <Text style={styles.emoji}>{guide.thumbnailEmoji}</Text>
        <View style={styles.titleSection}>
          <Text style={styles.title}>{guide.title}</Text>
          <Text
            style={styles.description}
            numberOfLines={2}
            testID="guide-description"
          >
            {guide.description}
          </Text>
        </View>
      </View>

      <View style={styles.metadata}>
        <Text style={styles.metadataText}>📝 {guide.stepCount} steps</Text>
        <Text style={styles.metadataText}>⏱ {durationDisplay}</Text>
        <Text style={styles.metadataText}>🏷️ {guide.categoryName}</Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  emoji: {
    fontSize: 48,
    marginRight: spacing.lg,
    marginTop: spacing.xs,
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: typography.sizeSm,
    color: colors.textSecondary,
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metadataText: {
    fontSize: typography.sizeSm,
    color: colors.textSecondary,
  },
})
