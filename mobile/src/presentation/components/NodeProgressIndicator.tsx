import React from 'react'
import { View, StyleSheet } from 'react-native'
import { colors, nodeTokens } from '@guidr/shared/tokens'

interface NodeProgressIndicatorProps {
  currentStep: number
  totalSteps: number
  variant?: 'compact' | 'detailed'
  testID?: string
}

export const NodeProgressIndicator: React.FC<NodeProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
  testID,
}) => {
  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    nodeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    node: {
      width: nodeTokens.size,
      height: nodeTokens.size,
      borderRadius: nodeTokens.size / 2,
      backgroundColor: colors.textTertiary,
      marginHorizontal: nodeTokens.spacing / 2,
    },
    nodeActive: {
      width: nodeTokens.activeSize,
      height: nodeTokens.activeSize,
      borderRadius: nodeTokens.activeSize / 2,
      backgroundColor: colors.primary,
    },
    nodeCompleted: {
      backgroundColor: colors.primary,
    },
    line: {
      height: nodeTokens.lineWidth,
      backgroundColor: colors.textTertiary,
      flex: 1,
      marginHorizontal: -nodeTokens.spacing / 2,
      maxWidth: nodeTokens.spacing,
    },
    lineCompleted: {
      backgroundColor: colors.primary,
    },
  })

  const nodes: React.ReactNode[] = []

  for (let i = 1; i <= totalSteps; i++) {
    // Add connecting line (but not before the first node)
    if (i > 1) {
      const isCompleted = i - 1 < currentStep
      nodes.push(
        <View
          key={`line-${i}`}
          style={[styles.line, isCompleted && styles.lineCompleted]}
        />
      )
    }

    // Add node
    const isActive = i === currentStep
    const isCompleted = i < currentStep
    nodes.push(
      <View
        key={`node-${i}`}
        style={[
          styles.node,
          isActive && styles.nodeActive,
          isCompleted && styles.nodeCompleted,
        ]}
        testID={`${testID}:node-${i}`}
      />
    )
  }

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.nodeContainer}>{nodes}</View>
    </View>
  )
}
