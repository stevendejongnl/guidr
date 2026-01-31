/**
 * React Native style helper functions
 * Consolidated from individual adapter files
 * Provides composition and dynamic style generation
 */

import { StyleSheet, type ViewStyle, type TextStyle } from 'react-native'
import {
  statusBadgeColorMap,
  statusBadgeLabels,
  buttonDefinitions,
  formDefinitions,
  inputDefinitions,
  badgeDefinitions,
  cardDefinitions,
  type BadgeVariant,
  type BadgeSize,
  type StatusBadgeStatus,
  type ButtonVariant,
  type ButtonSize,
  type CardVariant,
  type FormFieldSize,
} from '../../definitions'
import { inputPlaceholderColor } from '../../definitions/inputs'

// Create StyleSheets for helper functions (cached by React Native)
const buttonStyles = StyleSheet.create(buttonDefinitions as any)
const formStyles = StyleSheet.create(formDefinitions as any)
const inputStyles = StyleSheet.create(inputDefinitions as any)
const badgeStyles = StyleSheet.create(badgeDefinitions as any)
const cardStyles = StyleSheet.create(cardDefinitions as any)

// ============================================================================
// Button Helpers
// ============================================================================

/**
 * Get button style array based on variant and state
 */
export const getButtonStyle = (
  variant: ButtonVariant,
  disabled: boolean = false,
  size: ButtonSize = 'normal'
): ViewStyle[] => {
  const styleArray: ViewStyle[] = [buttonStyles.base]

  // Add variant
  if (variant === 'primary') {
    styleArray.push(buttonStyles.primary)
  } else if (variant === 'secondary') {
    styleArray.push(buttonStyles.secondary)
  } else if (variant === 'danger') {
    styleArray.push(buttonStyles.danger)
  } else if (variant === 'outline') {
    styleArray.push(buttonStyles.outline)
  }

  // Add size
  if (size === 'small') {
    styleArray.push(buttonStyles.small)
  } else if (size === 'large') {
    styleArray.push(buttonStyles.large)
  }

  // Add disabled state
  if (disabled) {
    styleArray.push(buttonStyles.disabled)
  }

  return styleArray
}

// ============================================================================
// Form Helpers
// ============================================================================

/**
 * Get label style based on size
 */
export const getLabelStyle = (size: FormFieldSize = 'medium'): TextStyle => {
  switch (size) {
    case 'small':
      return formStyles.labelSmall
    case 'large':
      return formStyles.label
    default:
      return formStyles.label
  }
}

/**
 * Get input form style (multiline or singleline)
 */
export const getInputFormStyle = (multiline: boolean = false): ViewStyle[] => {
  return multiline ? [formStyles.multilineInput] : [formStyles.singlelineInput]
}

/**
 * Get form group style (compact or normal)
 */
export const getFormGroupStyle = (compact: boolean = false): ViewStyle => {
  return compact ? formStyles.formGroupCompact : formStyles.formGroup
}

/**
 * Get button group style (compact or normal)
 */
export const getButtonGroupStyle = (compact: boolean = false): ViewStyle => {
  return compact ? formStyles.buttonGroupCompact : formStyles.buttonGroup
}

// ============================================================================
// Input Helpers
// ============================================================================

/**
 * Re-export input placeholder color constant
 */
export { inputPlaceholderColor }

/**
 * Get input style array based on state and options
 */
export const getInputStyle = (options: {
  error?: boolean
  disabled?: boolean
  focused?: boolean
  withMargin?: boolean
  variant?: 'outline' | 'underline'
  size?: 'small' | 'normal' | 'large'
} = {}): ViewStyle[] => {
  const {
    error = false,
    disabled = false,
    focused = false,
    withMargin = true,
    variant = 'outline',
    size = 'normal',
  } = options

  const styleArray: ViewStyle[] = [inputStyles.base]

  // Add state styles
  if (error) {
    styleArray.push(inputStyles.error)
  }
  if (disabled) {
    styleArray.push(inputStyles.disabled)
  }
  if (focused && !error) {
    styleArray.push(inputStyles.focused)
  }

  // Add variant
  if (variant === 'underline') {
    styleArray.push(inputStyles.underline)
  } else {
    styleArray.push(inputStyles.outline)
  }

  // Add size
  if (size === 'small') {
    styleArray.push(inputStyles.small)
  } else if (size === 'large') {
    styleArray.push(inputStyles.large)
  }

  // Add margin
  if (withMargin) {
    styleArray.push(inputStyles.withMargin)
  }

  return styleArray
}

// ============================================================================
// Badge Helpers
// ============================================================================

/**
 * Status badge color mapping
 */
export const statusBadgeColors = statusBadgeColorMap

/**
 * Get human-readable label for status badge
 */
export const getStatusBadgeLabel = (status: StatusBadgeStatus): string => {
  return statusBadgeLabels[status]
}

/**
 * Get color for status badge
 */
export const getStatusColor = (status: StatusBadgeStatus): string => {
  return statusBadgeColors[status]
}

/**
 * Get badge style composition based on status, variant, and size
 */
export const getStatusBadgeStyle = (
  status: StatusBadgeStatus,
  variant: BadgeVariant = 'solid',
  size: BadgeSize = 'small'
) => {
  const statusColor = statusBadgeColors[status]

  // Container styles
  const containerStyles: ViewStyle[] = [
    badgeStyles.base,
    variant === 'solid' ? badgeStyles.solid : badgeStyles.outline,
    size === 'small' ? badgeStyles.small : badgeStyles.medium,
  ]

  if (variant === 'solid') {
    containerStyles.push({ backgroundColor: statusColor } as ViewStyle)
  } else {
    containerStyles.push({ borderColor: statusColor } as ViewStyle)
  }

  // Text styles
  const textStyles: TextStyle[] = [badgeStyles.text]
  const textColor = variant === 'solid' ? '#E6EDF3' : statusColor
  textStyles.push({ color: textColor } as TextStyle)

  return {
    container: containerStyles,
    text: textStyles,
  }
}

// ============================================================================
// Card Helpers
// ============================================================================

/**
 * Get card style array based on variant and margin
 */
export const getCardStyle = (
  variant: CardVariant = 'base',
  hasMargin: boolean = true
): ViewStyle[] => {
  const styleArray: ViewStyle[] = [cardStyles.base]

  if (variant === 'elevated') {
    styleArray.push(cardStyles.elevated)
  }

  if (hasMargin) {
    styleArray.push(cardStyles.withMargin)
  }

  return styleArray
}
