/**
 * React Native adapter
 * Converts platform-agnostic style definitions to React Native StyleSheets
 *
 * Usage:
 * import { buttonStyles, getButtonStyle, formStyles, commonStyles } from '@guidr/shared/styles/react-native'
 */

export {
  buttonStyles,
  getButtonStyle,
  type ButtonVariant,
  type ButtonSize,
} from './buttons'

export {
  cardStyles,
  getCardStyle,
  type CardVariant,
} from './cards'

export {
  badgeStyles,
  statusBadgeColors,
  getStatusBadgeLabel,
  getStatusBadgeStyle,
  getStatusColor,
  type BadgeVariant,
  type BadgeSize,
  type StatusBadgeStatus,
} from './badges'

export {
  inputStyles,
  inputPlaceholderColor,
  getInputStyle,
} from './inputs'

export {
  typographyStyles,
} from './typography'

export {
  layoutStyles,
} from './layout'

export {
  formStyles,
  getLabelStyle,
  getInputFormStyle,
  getFormGroupStyle,
  getButtonGroupStyle,
  type FormFieldSize,
} from './forms'

export {
  commonStyles,
} from './common'
