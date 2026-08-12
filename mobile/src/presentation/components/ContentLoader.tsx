import React, { useEffect, useMemo, useRef } from 'react'
import { View, Animated, StyleProp, ViewStyle } from 'react-native'
import { motionTokens } from '@guidr/shared/tokens'

interface ContentLoaderProps {
  isLoading: boolean
  skeleton: React.ReactNode
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
  testID?: string
}

/**
 * Generic "page effect" wrapper — the single place that owns the
 * loading-skeleton -> loaded-content transition. Screens describe what their
 * skeleton looks like (via Skeleton/SkeletonLines/SkeletonCard/SkeletonList)
 * and pass a loading flag; they never write their own Animated code.
 *
 * `testID` stays on the same wrapping node across the loading -> loaded
 * transition, so a test asserting the testID during the loading phase keeps
 * working unchanged after this is adopted.
 */
export const ContentLoader: React.FC<ContentLoaderProps> = ({
  isLoading,
  skeleton,
  children,
  style,
  testID,
}) => {
  // Create animated value if available (production), fallback for tests —
  // same guarded pattern as Skeleton/CountdownTimer.
  const fadeAnim = useMemo(() => {
    if (Animated?.Value) {
      return new Animated.Value(isLoading ? 0 : 1)
    }
    return {
      setValue: () => {},
    } as unknown as Animated.Value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const wasLoading = useRef(isLoading)

  useEffect(() => {
    if (!isLoading && wasLoading.current) {
      // Just finished loading — fade the newly-shown content in rather than
      // snapping straight to it.
      if (Animated?.timing) {
        fadeAnim.setValue(0)
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: motionTokens.slow,
          useNativeDriver: true,
        }).start()
      } else {
        fadeAnim.setValue(1)
      }
    } else if (!isLoading) {
      fadeAnim.setValue(1)
    }
    wasLoading.current = isLoading
  }, [isLoading, fadeAnim])

  const hasAnimated = !!Animated && !!Animated.View
  const Wrapper = hasAnimated ? Animated.View : View

  return (
    <Wrapper
      testID={testID}
      style={[style, hasAnimated ? { opacity: fadeAnim as unknown as number } : null]}
    >
      {isLoading ? skeleton : children}
    </Wrapper>
  )
}
