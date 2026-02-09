/**
 * React Native adapter for form styles
 */

import { StyleSheet, ViewStyle, TextStyle } from 'react-native'
import { formDefinitions, type FormFieldSize } from '../../definitions/forms'

export const formStyles = StyleSheet.create({
  scrollView: formDefinitions.scrollView as ViewStyle,
  container: formDefinitions.container as ViewStyle,
  formGroup: formDefinitions.formGroup as ViewStyle,
  formGroupCompact: formDefinitions.formGroupCompact as ViewStyle,
  toggleGroup: formDefinitions.toggleGroup as ViewStyle,
  label: formDefinitions.label as TextStyle,
  labelSmall: formDefinitions.labelSmall as TextStyle,
  labelSecondary: formDefinitions.labelSecondary as TextStyle,
  hint: formDefinitions.hint as TextStyle,
  multilineInput: formDefinitions.multilineInput as ViewStyle,
  descriptionInput: formDefinitions.descriptionInput as ViewStyle,
  singlelineInput: formDefinitions.singlelineInput as ViewStyle,
  readOnlyContainer: formDefinitions.readOnlyContainer as ViewStyle,
  typeReadOnly: formDefinitions.typeReadOnly as ViewStyle,
  readOnlyText: formDefinitions.readOnlyText as TextStyle,
  typeReadOnlyText: formDefinitions.typeReadOnlyText as TextStyle,
  toggleContainer: formDefinitions.toggleContainer as ViewStyle,
  toggleLabel: formDefinitions.toggleLabel as TextStyle,
  toggleHint: formDefinitions.toggleHint as TextStyle,
  buttonGroup: formDefinitions.buttonGroup as ViewStyle,
  buttonGroupCompact: formDefinitions.buttonGroupCompact as ViewStyle,
  buttonInGroup: formDefinitions.buttonInGroup as ViewStyle,
  cancelButton: formDefinitions.cancelButton as ViewStyle,
  deleteButton: formDefinitions.deleteButton as ViewStyle,
  helperText: formDefinitions.helperText as TextStyle,
  errorHelper: formDefinitions.errorHelper as TextStyle,
  successHelper: formDefinitions.successHelper as TextStyle,
  formContainer: formDefinitions.formContainer as ViewStyle,
  formContent: formDefinitions.formContent as ViewStyle,
  centerContainer: formDefinitions.centerContainer as ViewStyle,
})

export type { FormFieldSize }

export const getLabelStyle = (size: FormFieldSize = 'medium'): TextStyle => {
  switch (size) {
    case 'small':
      return formStyles.labelSmall
    case 'large':
      return formStyles.label
    default:
      return formStyles.label
  }
}

export const getInputFormStyle = (multiline: boolean = false): ViewStyle[] => {
  return multiline ? [formStyles.multilineInput] : [formStyles.singlelineInput]
}

export const getFormGroupStyle = (compact: boolean = false): ViewStyle => {
  return compact ? formStyles.formGroupCompact : formStyles.formGroup
}

export const getButtonGroupStyle = (compact: boolean = false): ViewStyle => {
  return compact ? formStyles.buttonGroupCompact : formStyles.buttonGroup
}
