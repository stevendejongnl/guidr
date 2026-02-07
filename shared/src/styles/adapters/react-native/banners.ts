/**
 * React Native adapter for banner styles
 */

import { StyleSheet, ViewStyle, TextStyle } from 'react-native'
import { colors } from '../../../tokens/colors'
import {
  bannerDefinitions,
  type BannerVariant,
} from '../../definitions/banners'

export const bannerStyles = StyleSheet.create({
  base: bannerDefinitions.base.container as ViewStyle,
  text: bannerDefinitions.base.text as TextStyle,
})

export type { BannerVariant }

export const getBannerStyle = (variant: BannerVariant = 'info') => {
  const variantDef = bannerDefinitions.variants[variant]

  const containerStyles: ViewStyle[] = [bannerStyles.base]

  // Get actual colors from token definitions
  const backgroundColor =
    variantDef.backgroundColor === 'surfaceLight'
      ? colors.surfaceLight
      : colors.surface

  const borderColor = (colors as Record<string, string>)[variantDef.borderColor]
  const textColor = (colors as Record<string, string>)[variantDef.textColor]

  containerStyles.push({
    backgroundColor,
    borderLeftColor: borderColor,
  } as ViewStyle)

  const textStyles: TextStyle[] = [bannerStyles.text]
  textStyles.push({
    color: textColor,
  } as TextStyle)

  return {
    container: containerStyles,
    text: textStyles,
  }
}
