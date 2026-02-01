/**
 * Shared styling system - Platform-agnostic definitions with adapters
 *
 * Architecture:
 * - definitions/ - Platform-agnostic style definitions
 * - adapters/ - Platform-specific implementations (react-native, lit, etc.)
 *
 * Usage:
 * // React Native
 * import { buttonStyles, formStyles } from '@guidr/shared/styles/adapters/react-native'
 *
 * // Build custom adapters
 * import { buttonDefinitions, formDefinitions } from '@guidr/shared/styles/definitions'
 */

export * as definitions from './definitions'
export * as reactNative from './adapters/react-native'
