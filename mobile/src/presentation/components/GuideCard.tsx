import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native'
import { colors, spacing, typography, borderRadius, componentDefaults } from '@guidr/shared/tokens'
import { GuideViewModel } from '../viewmodels/GuideViewModel'
import { NodeProgressIndicator } from './NodeProgressIndicator'
import { StatusBadge } from './StatusBadge'

interface GuideCardProps {
  guide: GuideViewModel
  onPress?: () => void
  isFavorited?: boolean
  isOwned?: boolean
  onToggleFavorite?: () => void
  testID?: string
}

export const GuideCard: React.FC<GuideCardProps> = ({
  guide,
  onPress,
  isFavorited,
  isOwned,
  onToggleFavorite,
  testID,
}) => {
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
      {/* Top Right Indicators */}
      <View style={styles.statusBadgeContainer}>
        {isOwned && (
          <View style={styles.ownedBadge} testID={`${testID}:owned`}>
            <Text style={styles.ownedBadgeText}>Yours</Text>
          </View>
        )}
        {guide.status && (
          <StatusBadge status={guide.status} variant="solid" testID={`${testID}:status`} />
        )}
        {onToggleFavorite && (
          <TouchableOpacity
            onPress={onToggleFavorite}
            testID={`${testID}:favorite`}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.favoriteIcon}>{isFavorited ? '♥' : '♡'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Header with Image and Title */}
      <View style={styles.header}>
        {guide.imageUrl && (
          <Image
            source={{ uri: guide.imageUrl }}
            style={styles.thumbnail}
            testID={`${testID}:image`}
          />
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
            {guide.rating.toFixed(1)} {guide.ratingCount ? `(${guide.ratingCount})` : ''}
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
        <Text style={styles.metadataText}>{guide.stepCount} steps</Text>
        <Text style={styles.metadataText}>{durationDisplay}</Text>
        <Text style={styles.metadataText}>{guide.guideTypeLabel}</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ownedBadge: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  ownedBadgeText: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.textPrimary,
  },
  favoriteIcon: {
    fontSize: 20,
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
