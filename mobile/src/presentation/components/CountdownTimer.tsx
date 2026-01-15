import React, { useState, useEffect, useRef, useMemo } from 'react'
import { View, Text, StyleSheet, Animated } from 'react-native'
import { colors, spacing, typography } from '../theme'

interface CountdownTimerProps {
  /**
   * Total duration in seconds for the timer
   */
  durationSeconds: number

  /**
   * Whether timer is currently running
   */
  isRunning: boolean

  /**
   * Called when timer reaches 0 (step completes)
   */
  onComplete?: () => void

  /**
   * Called each second with remaining seconds (optional, for tracking elapsed time)
   */
  onSecondsChange?: (remainingSeconds: number) => void

  /**
   * Test identifier
   */
  testID?: string
}

/**
 * CountdownTimer Component
 *
 * Displays a countdown timer in MM:SS format with color transitions:
 * - Green: > 50% remaining
 * - Yellow: 25-50% remaining
 * - Red: < 25% remaining
 * - Pulsing: < 10 seconds remaining
 *
 * Uses setInterval for countdown logic and tracks elapsed time for
 * server-side persistence when paused.
 */
export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  durationSeconds,
  isRunning,
  onComplete,
  onSecondsChange,
  testID,
}) => {
  const [remainingSeconds, setRemainingSeconds] = useState(durationSeconds)
  const pulseAnim = useMemo(() => new Animated.Value(1), [])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Determine timer color based on remaining time percentage
  const getTimerColor = (): string => {
    const percentage = (remainingSeconds / durationSeconds) * 100
    if (percentage > 50) return colors.success // Green
    if (percentage > 25) return colors.warning // Yellow
    return colors.danger // Red
  }

  // Pulsing animation for last 10 seconds
  useEffect(() => {
    if (remainingSeconds < 10 && remainingSeconds > 0 && isRunning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 300,
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: false,
          }),
        ])
      ).start()
    } else {
      pulseAnim.setValue(1)
    }
  }, [remainingSeconds, isRunning])

  // Main countdown logic
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        const next = Math.max(0, prev - 1)

        // Notify listeners of remaining time
        onSecondsChange?.(next)

        // Complete when timer reaches 0
        if (next === 0) {
          onComplete?.()
        }

        return next
      })
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isRunning, onComplete, onSecondsChange])

  // Reset when duration changes
  useEffect(() => {
    setRemainingSeconds(durationSeconds)
  }, [durationSeconds])

  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

  return (
    <View style={styles.container} testID={testID}>
      <Animated.View
        style={[
          styles.timerDisplay,
          {
            transform: [{ scale: pulseAnim }],
            borderColor: getTimerColor(),
          },
        ]}
      >
        <Text
          style={[
            styles.timerText,
            {
              color: getTimerColor(),
            },
          ]}
          testID="timer-text"
        >
          {formattedTime}
        </Text>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  timerDisplay: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  timerText: {
    fontSize: typography.sizeXxxl,
    fontWeight: typography.weightBold,
    fontFamily: 'Courier New',
  },
})
