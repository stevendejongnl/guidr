/**
 * React Native adapter for input styles
 */

import { StyleSheet, ViewStyle } from 'react-native'
import { inputDefinitions, inputPlaceholderColor } from '../../definitions/inputs'

export const inputStyles = StyleSheet.create({
  base: inputDefinitions.base as ViewStyle,
  error: inputDefinitions.error as ViewStyle,
  disabled: inputDefinitions.disabled as ViewStyle,
  focused: inputDefinitions.focused as ViewStyle,
  outline: inputDefinitions.outline as ViewStyle,
  underline: inputDefinitions.underline as ViewStyle,
  withMargin: inputDefinitions.withMargin as ViewStyle,
  small: inputDefinitions.small as ViewStyle,
  large: inputDefinitions.large as ViewStyle,
})

export { inputPlaceholderColor }

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

  const styles: ViewStyle[] = [inputStyles.base]

  if (error) {
    styles.push(inputStyles.error)
  }
  if (disabled) {
    styles.push(inputStyles.disabled)
  }
  if (focused && !error) {
    styles.push(inputStyles.focused)
  }

  if (variant === 'underline') {
    styles.push(inputStyles.underline)
  } else {
    styles.push(inputStyles.outline)
  }

  if (size === 'small') {
    styles.push(inputStyles.small)
  } else if (size === 'large') {
    styles.push(inputStyles.large)
  }

  if (withMargin) {
    styles.push(inputStyles.withMargin)
  }

  return styles
}
