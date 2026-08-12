import React, { useEffect, useMemo } from 'react'
import { View, StyleSheet, Animated, StyleProp, ViewStyle, DimensionValue } from 'react-native'
import { colors, spacing, borderRadius, componentDefaults } from '@guidr/shared/tokens'

interface SkeletonProps {
  width?: DimensionValue
  height?: DimensionValue
  radius?: number
  style?: StyleProp<ViewStyle>
  testID?: string
}

/**
 * Atomic shimmering placeholder rectangle. The only component in the app
 * that owns shimmer animation logic — everything else (SkeletonLines,
 * SkeletonCard, SkeletonList, and screen-specific skeletons) composes this.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  radius = borderRadius.sm,
  style,
  testID,
}) => {
  // Create animated value if available (production), fallback for tests —
  // same guarded pattern as CountdownTimer's pulseAnim.
  const pulseAnim = useMemo(() => {
    if (Animated?.Value) {
      return new Animated.Value(0.6)
    }
    return {
      setValue: () => {},
    } as unknown as Animated.Value
  }, [])

  useEffect(() => {
    if (!Animated?.loop) return // Skip in test environments

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    )
    loop.start()

    return () => loop.stop()
  }, [pulseAnim])

  const Block = Animated?.View ?? View

  return (
    <Block
      testID={testID}
      style={[
        styles.base,
        { width, height, borderRadius: radius, opacity: pulseAnim as unknown as number },
        style,
      ]}
    />
  )
}

interface SkeletonLinesProps {
  count?: number
  lineHeight?: number
  gap?: number
  lastLineWidth?: DimensionValue
  style?: StyleProp<ViewStyle>
  testID?: string
}

/** N stacked text-line placeholders — for descriptions, metadata, form fields. */
export const SkeletonLines: React.FC<SkeletonLinesProps> = ({
  count = 3,
  lineHeight = 14,
  gap = spacing.sm,
  lastLineWidth = '60%',
  style,
  testID,
}) => (
  <View style={[{ gap }, style]} testID={testID}>
    {Array.from({ length: count }, (_, index) => (
      <Skeleton
        key={index}
        height={lineHeight}
        width={index === count - 1 ? lastLineWidth : '100%'}
      />
    ))}
  </View>
)

interface SkeletonCardProps {
  style?: StyleProp<ViewStyle>
  testID?: string
}

/** Title+subtitle placeholder inside a card-shaped container, matching GuideCard/ActiveTimerCard/ActivityItem. */
export const SkeletonCard: React.FC<SkeletonCardProps> = ({ style, testID }) => (
  <View style={[styles.card, style]} testID={testID}>
    <Skeleton width="70%" height={16} style={styles.cardTitleGap} />
    <Skeleton width="40%" height={12} />
  </View>
)

interface SkeletonListProps {
  count: number
  renderItem: (index: number) => React.ReactNode
  gap?: number
  style?: StyleProp<ViewStyle>
  testID?: string
}

/** Repeats a given skeleton item template `count` times with consistent spacing. */
export const SkeletonList: React.FC<SkeletonListProps> = ({
  count,
  renderItem,
  gap = spacing.sm,
  style,
  testID,
}) => (
  <View style={[{ gap }, style]} testID={testID}>
    {Array.from({ length: count }, (_, index) => (
      <View key={index}>{renderItem(index)}</View>
    ))}
  </View>
)

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.cardElevated,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: componentDefaults.cardPadding,
  },
  cardTitleGap: {
    marginBottom: spacing.sm,
  },
})
