import React from 'react'
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
} from 'react-native'
import { colors, spacing, borderRadius, typography, componentDefaults } from '@guidr/shared/tokens'

interface SearchBarProps {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  onClear?: () => void
  testID?: string
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  onClear,
  testID,
}) => {
  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      minHeight: componentDefaults.chipHeight,
    },
    input: {
      flex: 1,
      marginLeft: spacing.md,
      fontSize: typography.sizeMd,
      color: colors.textPrimary,
      padding: 0,
    },
    icon: {
      marginRight: spacing.sm,
    },
    clearButton: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
  })

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.icon}>🔍</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        testID={`${testID}:input`}
      />
      {value.length > 0 && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => {
            onChangeText('')
            onClear?.()
          }}
          testID={`${testID}:clear`}
        >
          <Text>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}
