/**
 * React Native adapter for card styles
 */

import { StyleSheet, ViewStyle } from 'react-native'
import { cardDefinitions, type CardVariant } from '../../definitions/cards'

export const cardStyles = StyleSheet.create({
  base: cardDefinitions.base as ViewStyle,
  elevated: cardDefinitions.elevated as ViewStyle,
  withMargin: cardDefinitions.withMargin as ViewStyle,
  compactMargin: cardDefinitions.compactMargin as ViewStyle,
  shadowSmall: cardDefinitions.shadowSmall as ViewStyle,
  shadowMedium: cardDefinitions.shadowMedium as ViewStyle,
})

export type { CardVariant }

export const getCardStyle = (
  variant: CardVariant = 'base',
  hasMargin: boolean = true
): ViewStyle[] => {
  const styles: ViewStyle[] = [cardStyles.base]

  if (variant === 'elevated') {
    styles.push(cardStyles.elevated)
  }

  if (hasMargin) {
    styles.push(cardStyles.withMargin)
  }

  return styles
}
