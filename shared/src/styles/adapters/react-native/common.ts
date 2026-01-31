/**
 * React Native adapter for common/global styles
 */

import { StyleSheet, ViewStyle, TextStyle } from 'react-native'
import { commonDefinitions } from '../../definitions/common'

export const commonStyles = StyleSheet.create({
  container: commonDefinitions.container as ViewStyle,
  containerTop: commonDefinitions.containerTop as ViewStyle,
  content: commonDefinitions.content as ViewStyle,
  contentCentered: commonDefinitions.contentCentered as ViewStyle,
  title: commonDefinitions.title as TextStyle,
  titleLarge: commonDefinitions.titleLarge as TextStyle,
  subtitle: commonDefinitions.subtitle as TextStyle,
  description: commonDefinitions.description as TextStyle,
  descriptionCentered: commonDefinitions.descriptionCentered as TextStyle,
  input: commonDefinitions.input as ViewStyle,
  inputError: commonDefinitions.inputError as ViewStyle,
  button: commonDefinitions.button as ViewStyle,
  buttonDisabled: commonDefinitions.buttonDisabled as ViewStyle,
  buttonSecondary: commonDefinitions.buttonSecondary as ViewStyle,
  buttonDanger: commonDefinitions.buttonDanger as ViewStyle,
  buttonOutline: commonDefinitions.buttonOutline as ViewStyle,
  buttonText: commonDefinitions.buttonText as TextStyle,
  buttonTextMuted: commonDefinitions.buttonTextMuted as TextStyle,
  errorText: commonDefinitions.errorText as TextStyle,
  successText: commonDefinitions.successText as TextStyle,
  warningText: commonDefinitions.warningText as TextStyle,
  activityIndicator: commonDefinitions.activityIndicator as ViewStyle,
  loadingContainer: commonDefinitions.loadingContainer as ViewStyle,
  section: commonDefinitions.section as ViewStyle,
  sectionTitle: commonDefinitions.sectionTitle as TextStyle,
  link: commonDefinitions.link as ViewStyle,
  linkText: commonDefinitions.linkText as TextStyle,
})
