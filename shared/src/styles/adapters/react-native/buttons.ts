/**
 * React Native adapter for button styles
 * Converts platform-agnostic buttonDefinitions to React Native StyleSheets
 */

import { StyleSheet, ViewStyle } from 'react-native'
import { buttonDefinitions, type ButtonVariant, type ButtonSize } from '../../definitions/buttons'

// Create StyleSheet from definitions
export const buttonStyles = StyleSheet.create({
  base: buttonDefinitions.base as ViewStyle,
  primary: buttonDefinitions.primary as ViewStyle,
  secondary: buttonDefinitions.secondary as ViewStyle,
  danger: buttonDefinitions.danger as ViewStyle,
  outline: buttonDefinitions.outline as ViewStyle,
  disabled: buttonDefinitions.disabled as ViewStyle,
  text: buttonDefinitions.text,
  textMuted: buttonDefinitions.textMuted,
  small: buttonDefinitions.small as ViewStyle,
  large: buttonDefinitions.large as ViewStyle,
  marginTop: buttonDefinitions.marginTop as ViewStyle,
})

export type { ButtonVariant, ButtonSize }

/**
 * Get button style array based on variant and state
 */
export const getButtonStyle = (
  variant: ButtonVariant,
  disabled: boolean = false,
  size: ButtonSize = 'normal'
): ViewStyle[] => {
  const styles: ViewStyle[] = [buttonStyles.base]

  if (variant === 'primary') {
    styles.push(buttonStyles.primary)
  } else if (variant === 'secondary') {
    styles.push(buttonStyles.secondary)
  } else if (variant === 'danger') {
    styles.push(buttonStyles.danger)
  } else if (variant === 'outline') {
    styles.push(buttonStyles.outline)
  }

  if (size === 'small') {
    styles.push(buttonStyles.small)
  } else if (size === 'large') {
    styles.push(buttonStyles.large)
  }

  if (disabled) {
    styles.push(buttonStyles.disabled)
  }

  return styles
}
