/**
 * React Native adapter for typography styles
 */

import { StyleSheet } from 'react-native'
import { typographyDefinitions } from '../../definitions/typography'

export const typographyStyles = StyleSheet.create({
  h1: typographyDefinitions.h1,
  h2: typographyDefinitions.h2,
  h3: typographyDefinitions.h3,
  h4: typographyDefinitions.h4,
  h5: typographyDefinitions.h5,
  bodyLarge: typographyDefinitions.bodyLarge,
  body: typographyDefinitions.body,
  bodySmall: typographyDefinitions.bodySmall,
  secondaryLarge: typographyDefinitions.secondaryLarge,
  secondary: typographyDefinitions.secondary,
  secondarySmall: typographyDefinitions.secondarySmall,
  muted: typographyDefinitions.muted,
  mutedSmall: typographyDefinitions.mutedSmall,
  error: typographyDefinitions.error,
  success: typographyDefinitions.success,
  warning: typographyDefinitions.warning,
  marginBottom: typographyDefinitions.marginBottom,
  marginBottomSmall: typographyDefinitions.marginBottomSmall,
})
