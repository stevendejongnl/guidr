import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { Category } from '../../domain/entities/Category'
import { CategoryService } from '../../domain/services/CategoryService'
import { CategoryPicker } from './CategoryPicker'
import { colors, spacing, commonStyles, typography } from '@guidr/shared/tokens'

interface CategoryPickerButtonProps {
  selectedCategoryId: string | null
  onSelectCategory: (categoryId: string) => void
  authToken: string
  categoryService: CategoryService
  disabled?: boolean
}

export const CategoryPickerButton: React.FC<CategoryPickerButtonProps> = ({
  selectedCategoryId,
  onSelectCategory,
  authToken,
  categoryService,
  disabled = false,
}) => {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pickerVisible, setPickerVisible] = useState(false)
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null)

  useEffect(() => {
    loadCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // Load the selected category name
    if (selectedCategoryId && categories.length > 0) {
      const selected = categories.find((c) => c.id === selectedCategoryId)
      setSelectedCategoryName(selected?.name || null)
    } else {
      setSelectedCategoryName(null)
    }
  }, [selectedCategoryId, categories])

  const loadCategories = async () => {
    try {
      setError(null)
      setLoading(true)
      const result = await categoryService.getAllCategories(authToken)
      setCategories(result)
    } catch (err) {
      console.error('Error loading categories:', err)
      setError(err instanceof Error ? err.message : 'Error loading categories')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectCategory = (categoryId: string) => {
    onSelectCategory(categoryId)
    setPickerVisible(false)
  }

  const handleCancel = () => {
    setPickerVisible(false)
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={commonStyles.errorText}>{error}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          commonStyles.input,
          styles.buttonStyle,
          disabled && commonStyles.inputError,
        ]}
        onPress={() => setPickerVisible(true)}
        disabled={disabled || loading}
        testID="category-picker-button"
      >
        <View style={styles.buttonContent}>
          <Text
            style={[
              styles.buttonText,
              !selectedCategoryName && styles.placeholderText,
            ]}
          >
            {selectedCategoryName || 'Select Category'}
          </Text>
          {loading ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              testID="category-picker-loading"
            />
          ) : (
            <Text style={styles.dropdownIcon}>▼</Text>
          )}
        </View>
      </TouchableOpacity>

      <CategoryPicker
        visible={pickerVisible}
        categories={categories}
        selectedId={selectedCategoryId}
        onSelect={(categoryId: string) => handleSelectCategory(categoryId)}
        onCancel={handleCancel}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  buttonStyle: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    justifyContent: 'space-between',
  },
  buttonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    fontSize: typography.sizeMd,
    color: colors.textPrimary,
    flex: 1,
  },
  placeholderText: {
    color: colors.textSecondary,
  },
  dropdownIcon: {
    fontSize: typography.sizeSm,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
})
