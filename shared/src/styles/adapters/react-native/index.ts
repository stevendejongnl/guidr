/**
 * Dynamic React Native adapter
 * Automatically converts style definitions to React Native StyleSheets
 *
 * This uses lazy getters to dynamically create StyleSheets on-demand,
 * eliminating manual adapter files for each style component.
 *
 * Usage (primary API - new code should use this):
 * import { styles } from '@guidr/shared/styles/adapters/react-native'
 * const buttonStyles = styles.buttons  // Auto-converts buttonDefinitions
 * const formStyles = styles.forms      // Auto-converts formDefinitions
 *
 * Usage (legacy API - for backwards compatibility):
 * import { buttonStyles, formStyles } from '@guidr/shared/styles/react-native'
 */

import { StyleSheet, type ViewStyle, type TextStyle } from 'react-native'

// Import all style definitions
import {
  buttonDefinitions,
  cardDefinitions,
  badgeDefinitions,
  inputDefinitions,
  typographyDefinitions,
  layoutDefinitions,
  formDefinitions,
  commonDefinitions,
} from '../../definitions'

// Re-export helper functions and types
export * from './helpers'

// Re-export types from definitions
export type {
  ButtonVariant,
  ButtonSize,
  CardVariant,
  BadgeVariant,
  BadgeSize,
  StatusBadgeStatus,
  FormFieldSize,
} from '../../definitions'

// Re-export constants
export { inputPlaceholderColor } from '../../definitions/inputs'

/**
 * Cache for created StyleSheets (memoization for performance)
 */
const styleCache = new Map<string, Record<string, ViewStyle | TextStyle>>()

/**
 * Create and cache a StyleSheet from definitions
 */
function createCachedStyleSheet(
  key: string,
  definitions: Record<string, any>
): Record<string, ViewStyle | TextStyle> {
  if (!styleCache.has(key)) {
    try {
      styleCache.set(key, StyleSheet.create(definitions))
    } catch (error) {
      throw new Error(
        `Failed to create StyleSheet for "${key}": ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  return styleCache.get(key)!
}

/**
 * Style object with lazy getters
 * Each property converts style definitions to StyleSheet on first access
 */
export const styles = {
  get buttons() {
    return createCachedStyleSheet('buttons', buttonDefinitions)
  },

  get cards() {
    return createCachedStyleSheet('cards', cardDefinitions)
  },

  get badges() {
    return createCachedStyleSheet('badges', badgeDefinitions)
  },

  get inputs() {
    return createCachedStyleSheet('inputs', inputDefinitions)
  },

  get typography() {
    return createCachedStyleSheet('typography', typographyDefinitions)
  },

  get layout() {
    return createCachedStyleSheet('layout', layoutDefinitions)
  },

  get forms() {
    return createCachedStyleSheet('forms', formDefinitions)
  },

  get common() {
    return createCachedStyleSheet('common', commonDefinitions)
  },
}

// ============================================================================
// Legacy Exports for Backwards Compatibility
// ============================================================================

/**
 * Individual style exports for backwards compatibility
 * DEPRECATED: Use `styles.buttons`, `styles.forms`, etc. instead
 */
export const buttonStyles = styles.buttons
export const cardStyles = styles.cards
export const badgeStyles = styles.badges
export const inputStyles = styles.inputs
export const typographyStyles = styles.typography
export const layoutStyles = styles.layout
export const formStyles = styles.forms
export const commonStyles = styles.common
