/**
 * Info Banner Component
 * Displays informational messages with a colored left border and background.
 * Used for admin notifications and contextual information.
 */

import React from 'react'
import { View, Text } from 'react-native'
import { getBannerStyle, type BannerVariant } from '@guidr/shared/styles/react-native'

interface InfoBannerProps {
  /** Message to display */
  message: string
  /** Banner variant/color (info, warning, success, danger) */
  variant?: BannerVariant
  /** Whether to show the banner */
  visible?: boolean
  /** Test ID for testing */
  testID?: string
}

/**
 * Informational banner with left-border accent
 * Used to notify admins that they're editing others' content
 */
export const InfoBanner: React.FC<InfoBannerProps> = ({
  message,
  variant = 'info',
  visible = true,
  testID,
}) => {
  if (!visible) {
    return null
  }

  const styles = getBannerStyle(variant)

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.text}>{message}</Text>
    </View>
  )
}
