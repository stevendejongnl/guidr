/**
 * React Native adapter for layout styles
 */

import { StyleSheet, ViewStyle } from 'react-native'
import { layoutDefinitions } from '../../definitions/layout'

export const layoutStyles = StyleSheet.create({
  container: layoutDefinitions.container as ViewStyle,
  containerTop: layoutDefinitions.containerTop as ViewStyle,
  content: layoutDefinitions.content as ViewStyle,
  contentCentered: layoutDefinitions.contentCentered as ViewStyle,
  row: layoutDefinitions.row as ViewStyle,
  rowCenter: layoutDefinitions.rowCenter as ViewStyle,
  rowSpaceBetween: layoutDefinitions.rowSpaceBetween as ViewStyle,
  column: layoutDefinitions.column as ViewStyle,
  centerContent: layoutDefinitions.centerContent as ViewStyle,
  gap: layoutDefinitions.gap as ViewStyle,
  gapSmall: layoutDefinitions.gapSmall as ViewStyle,
  gapLarge: layoutDefinitions.gapLarge as ViewStyle,
  loadingContainer: layoutDefinitions.loadingContainer as ViewStyle,
  section: layoutDefinitions.section as ViewStyle,
})
