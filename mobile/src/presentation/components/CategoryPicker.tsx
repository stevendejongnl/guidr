import React from 'react'
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  ScrollView,
  TouchableOpacity,
} from 'react-native'
import { Category } from '../../domain/entities/Category'
import { colors, spacing, borderRadius, typography } from '../theme'

interface CategoryPickerProps {
  visible: boolean
  categories: Category[]
  selectedId: string | null
  onSelect: (categoryId: string, categoryName: string) => void
  onCancel: () => void
  testID?: string
}

export const CategoryPicker: React.FC<CategoryPickerProps> = ({
  visible,
  categories,
  selectedId,
  onSelect,
  onCancel,
}) => {
  const handleSelectCategory = (category: Category) => {
    onSelect(category.id, category.name)
  }

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>No categories available</Text>
    </View>
  )

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      testID="category-picker-modal"
    >
      <Pressable
        style={styles.overlay}
        onPress={onCancel}
        testID="category-picker-overlay"
      >
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Select Category</Text>
          </View>
          {categories.length === 0 ? (
            renderEmptyState()
          ) : (
            <ScrollView style={styles.scrollView} testID="category-list">
              {categories.map((category) => {
                const isSelected = category.id === selectedId
                return (
                  <TouchableOpacity
                    key={category.id}
                    style={[styles.categoryItem, isSelected && styles.categoryItemSelected]}
                    onPress={() => handleSelectCategory(category)}
                    testID={`category-item-${category.id}`}
                  >
                    <Text
                      style={[
                        styles.categoryItemText,
                        isSelected && styles.categoryItemTextSelected,
                      ]}
                    >
                      {category.name}
                    </Text>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          )}
        </View>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  header: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerText: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightSemibold,
    color: colors.textPrimary,
  },
  scrollView: {
    maxHeight: '100%',
  },
  categoryItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryItemSelected: {
    backgroundColor: colors.cardElevated,
  },
  categoryItemText: {
    fontSize: typography.sizeMd,
    color: colors.textPrimary,
    flex: 1,
  },
  categoryItemTextSelected: {
    fontWeight: typography.weightSemibold,
    color: colors.primary,
  },
  checkmark: {
    fontSize: typography.sizeLg,
    color: colors.primary,
    fontWeight: typography.weightBold,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
  },
  emptyStateText: {
    fontSize: typography.sizeMd,
    color: colors.textSecondary,
  },
})
