/**
 * Shared design tokens - exported by all platforms
 * Platform-agnostic tokens for consistent design system
 *
 * Usage:
 * - Mobile (React Native): import { colors, spacing } from '@guidr/shared/tokens'
 * - Web (Lit): import { colors, spacingWeb } from '@guidr/shared/tokens'
 */

export {
  colors,
  type ColorToken,
} from './colors'

export {
  spacing,
  spacingWeb,
  type SpacingToken,
} from './spacing'

export {
  borderRadius,
  type BorderRadiusToken,
} from './radius'

export {
  typography,
  type TypographyToken,
  type FontWeightToken,
} from './typography'

export {
  motionTokens,
  type MotionToken,
} from './motion'

export {
  componentDefaults,
  iconTokens,
  nodeTokens,
  type ComponentDefaultToken,
  type IconToken,
  type NodeToken,
} from './components'

// Common styles (re-exported from adapters for convenience during migration)
export { commonStyles } from '../styles/adapters/react-native'
