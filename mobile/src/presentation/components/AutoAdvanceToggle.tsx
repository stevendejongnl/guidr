import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Switch } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { colors, spacing, typography } from '@guidr/shared/tokens'

interface AutoAdvanceToggleProps {
  /**
   * Called when toggle changes
   */
  onValueChange?: (value: boolean) => void

  /**
   * Test identifier
   */
  testID?: string
}

const STORAGE_KEY = 'Guidr_SessionPreference_AutoAdvance'

/**
 * AutoAdvanceToggle Component
 *
 * Allows user to toggle automatic advancement to next step when timer completes.
 * Preference is persisted to AsyncStorage.
 *
 * When ON: Timer completion automatically moves to next step
 * When OFF: Timer completion pauses the session, user must manually advance
 */
export const AutoAdvanceToggle: React.FC<AutoAdvanceToggleProps> = ({
  onValueChange,
  testID,
}) => {
  const [isEnabled, setIsEnabled] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  // Load preference from AsyncStorage on mount
  useEffect(() => {
    const loadPreference = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY)
        // Default to true if not set
        const value = stored === null ? true : JSON.parse(stored)
        setIsEnabled(value)
      } catch (error) {
        // Default to true on error
        console.error('Failed to load auto-advance preference:', error)
        setIsEnabled(true)
      } finally {
        setIsLoading(false)
      }
    }

    loadPreference()
  }, [])

  // Save preference to AsyncStorage when it changes
  const handleToggle = async (value: boolean) => {
    try {
      setIsEnabled(value)
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(value))
      onValueChange?.(value)
    } catch (error) {
      console.error('Failed to save auto-advance preference:', error)
      // Revert on error
      setIsEnabled(!value)
    }
  }

  if (isLoading) {
    return null
  }

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.content}>
        <Text style={styles.label}>Auto-advance to next step</Text>
        <Text style={styles.description}>
          {isEnabled
            ? 'When timer completes, move to next step automatically'
            : 'When timer completes, pause and wait for manual advancement'}
        </Text>
      </View>
      <Switch
        value={isEnabled}
        onValueChange={handleToggle}
        trackColor={{ false: colors.buttonSecondary, true: colors.success }}
        thumbColor={isEnabled ? colors.success : colors.textMuted}
        testID="auto-advance-switch"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginVertical: spacing.md,
    gap: spacing.md,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: typography.sizeSm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
})
