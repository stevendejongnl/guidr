import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { colors, spacing, typography } from '@guidr/shared/tokens'

interface ScreenHeaderProps {
  onBack: () => void
  title?: string
  /** Right-side slot (e.g. an action button). Defaults to an empty spacer so the title stays centered. */
  rightElement?: React.ReactNode
  backTestID?: string
  backAccessibilityLabel?: string
  testID?: string
}

/**
 * Standard screen header: back button, optional centered title, optional
 * right-side action. Always render this inside SafeScreen — it doesn't
 * own safe-area insets itself.
 */
export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  onBack,
  title,
  rightElement,
  backTestID = 'back-button',
  backAccessibilityLabel = 'Go back',
  testID,
}) => {
  return (
    <View style={styles.header} {...(testID && { testID })}>
      <TouchableOpacity
        onPress={onBack}
        testID={backTestID}
        accessibilityLabel={backAccessibilityLabel}
      >
        <Text style={styles.backButton}>← Back</Text>
      </TouchableOpacity>
      {title !== undefined && <Text style={styles.title}>{title}</Text>}
      <View style={styles.rightSlot}>{rightElement}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backButton: {
    fontSize: typography.sizeMd,
    color: colors.primary,
    fontWeight: typography.weightSemibold,
  },
  title: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
  },
  rightSlot: {
    minWidth: 50,
    alignItems: 'flex-end',
  },
})
