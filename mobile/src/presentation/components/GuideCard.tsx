import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native'
import { colors, spacing, typography, borderRadius, componentDefaults } from '@guidr/shared/tokens'
import { GuideViewModel } from '../viewmodels/GuideViewModel'
import { NodeProgressIndicator } from './NodeProgressIndicator'
import { StatusBadge } from './StatusBadge'

interface GuideCardProps {
  guide: GuideViewModel
  onPress?: () => void
  testID?: string
}

export const GuideCard: React.FC<GuideCardProps> = ({ guide, onPress, testID }) => {
  const durationDisplay = guide.duration !== undefined && guide.duration > 0
    ? guide.duration < 60
      ? `${guide.duration} min`
      : `${Math.floor(guide.duration / 60)}h ${guide.duration % 60}m`
    : '— min'

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      testID={testID}
      activeOpacity={0.8}
    >
      {/* Status Badge - Top Right */}
      {guide.status && (
        <View style={styles.statusBadgeContainer}>
          <StatusBadge status={guide.status} variant="solid" testID={`${testID}:status`} />
        </View>
      )}

      {/* Header with Image/Emoji and Title */}
      <View style={styles.header}>
        {guide.imageUrl ? (
          <Image
            source={{ uri: guide.imageUrl }}
            style={styles.thumbnail}
            testID={`${testID}:image`}
          />
        ) : (
          <Text style={styles.emoji}>{guide.thumbnailEmoji}</Text>
        )}
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

      {/* Rating Section */}
      {guide.rating !== undefined && (
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingText}>
            ⭐ {guide.rating.toFixed(1)} {guide.ratingCount ? `(${guide.ratingCount})` : ''}
          </Text>
        </View>
      )}

      {/* Node Progress Indicator */}
      {guide.currentStep !== undefined && guide.stepCount > 0 && (
        <View style={styles.nodeProgressContainer}>
          <NodeProgressIndicator
            currentStep={guide.currentStep}
            totalSteps={guide.stepCount}
            variant="compact"
            testID={`${testID}:progress`}
          />
        </View>
      )}

      {/* Metadata */}
      <View style={styles.metadata}>
        <Text style={styles.metadataText}>📝 {guide.stepCount} steps</Text>
        <Text style={styles.metadataText}>⏱ {durationDisplay}</Text>
        <Text style={styles.metadataText}>🏷️ {guide.guideTypeLabel}</Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: componentDefaults.cardPadding,
    marginBottom: spacing.md,
    position: 'relative',
  },
  statusBadgeContainer: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: spacing.lg,
    marginTop: spacing.xs,
    backgroundColor: colors.cardElevated,
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
  ratingContainer: {
    marginBottom: spacing.sm,
  },
  ratingText: {
    fontSize: typography.sizeSm,
    color: colors.textSecondary,
  },
  nodeProgressContainer: {
    marginBottom: spacing.md,
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
