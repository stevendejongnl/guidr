import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Category } from '../../domain/entities/Category'
import { colors, spacing, typography } from '../theme'

interface CategoryListItemProps {
  category: Category
  hasChildren: boolean
  onPress: (category: Category) => void
  level?: number
}

export const CategoryListItem: React.FC<CategoryListItemProps> = ({
  category,
  hasChildren,
  onPress,
  level = 0,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, { paddingLeft: spacing.lg + level * spacing.md }]}
      onPress={() => onPress(category)}
      testID={`category-list-item-${category.id}`}
    >
      <View style={styles.content}>
        <Text style={styles.name}>{category.name}</Text>
        {hasChildren && <Text style={styles.indicator}>▶</Text>}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: typography.sizeMd,
    color: colors.textPrimary,
    flex: 1,
  },
  indicator: {
    fontSize: typography.sizeMd,
    color: colors.textSecondary,
    marginLeft: spacing.md,
  },
})
