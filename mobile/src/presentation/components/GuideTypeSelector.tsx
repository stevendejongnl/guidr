import React from 'react'
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native'
import { colors, spacing, borderRadius, typography, componentDefaults } from '@guidr/shared/tokens'
import { ALL_GUIDE_TYPES, GUIDE_TYPE_LABELS, type GuideType } from '../../domain/constants/GuideTypes'

interface GuideTypeSelectorProps {
  selectedType: GuideType | null
  onSelectType: (type: GuideType) => void
  disabled?: boolean
  testID?: string
}

export const GuideTypeSelector: React.FC<GuideTypeSelectorProps> = ({
  selectedType,
  onSelectType,
  disabled = false,
  testID = 'guide-type-selector',
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      testID={testID}
    >
      {ALL_GUIDE_TYPES.map(type => {
        const isSelected = selectedType === type
        return (
          <TouchableOpacity
            key={type}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => !disabled && onSelectType(type)}
            disabled={disabled}
            testID={`${testID}:${type}`}
            activeOpacity={0.7}
          >
            <Text style={[styles.label, isSelected && styles.labelSelected]}>
              {GUIDE_TYPE_LABELS[type]}
            </Text>
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 0,
  },
  contentContainer: {
    gap: spacing.md,
  },
  chip: {
    height: componentDefaults.chipHeight,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.textTertiary,
  },
  chipSelected: {
    backgroundColor: colors.buttonPrimary,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  label: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightMedium,
    color: colors.textSecondary,
  },
  labelSelected: {
    color: colors.textPrimary,
  },
})
