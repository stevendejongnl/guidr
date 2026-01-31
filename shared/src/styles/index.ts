/**
 * Shared styling system with platform-agnostic definitions and adapters
 *
 * Architecture:
 * - definitions/ - Platform-agnostic style definitions (TypeScript objects)
 * - adapters/react-native/ - React Native StyleSheet adapter
 * - adapters/lit/ - Lit/Web CSS adapter (future)
 *
 * Usage:
 * // For React Native (with StyleSheets)
 * import { buttonStyles, formStyles } from '@guidr/shared/styles/react-native'
 *
 * // For platform-agnostic definitions (to build other adapters)
 * import { buttonDefinitions, formDefinitions } from '@guidr/shared/styles/definitions'
 */

// Export definitions for custom adapters and extensions
export * as definitions from './definitions'

// Export React Native adapter (main entry point for mobile app)
export * from './react-native'
