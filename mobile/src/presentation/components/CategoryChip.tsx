import React from 'react'
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native'
import {
  colors,
  spacing,
  borderRadius,
  typography,
  componentDefaults,
} from '@guidr/shared/tokens'

interface CategoryChipProps {
  label: string
  selected: boolean
  onPress: () => void
  testID?: string
}

export const CategoryChip: React.FC<CategoryChipProps> = ({
  label,
  selected,
  onPress,
  testID,
}) => {
  const styles = StyleSheet.create({
    chip: {
      height: componentDefaults.chipHeight,
      borderRadius: borderRadius.sm,
      paddingHorizontal: spacing.lg,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
      backgroundColor: selected ? colors.buttonPrimary : 'transparent',
      borderWidth: selected ? 0 : 1,
      borderColor: selected ? 'transparent' : colors.textTertiary,
    } as ViewStyle,
    label: {
      fontSize: typography.sizeSm,
      fontWeight: typography.weightMedium,
      color: selected ? colors.textPrimary : colors.textSecondary,
    } as TextStyle,
  })

  return (
    <TouchableOpacity
      style={styles.chip}
      onPress={onPress}
      testID={testID}
      activeOpacity={0.7}
    >
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  )
}
