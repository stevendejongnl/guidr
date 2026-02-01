/**
 * React Native styles - Primary entry point for mobile
 * Internally uses dynamic adapter that converts definitions to StyleSheets
 *
 * DEPRECATED: This re-exports from adapters/react-native for backwards compatibility.
 * New code should import from '@guidr/shared/styles/adapters/react-native' directly.
 *
 * Usage (legacy):
 * import { buttonStyles, formStyles, commonStyles } from '@guidr/shared/styles/react-native'
 *
 * Usage (new):
 * import { styles } from '@guidr/shared/styles/adapters/react-native'
 * const buttonStyles = styles.buttons
 */

export * from '../adapters/react-native'
