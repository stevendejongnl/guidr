import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
import { colors, spacing, typography } from '@guidr/shared/tokens'
import { formStyles } from '@guidr/shared/styles/react-native'

export interface Ingredient {
  name: string
  quantity: string
  unit: string
}

interface IngredientsEditorProps {
  ingredients: Ingredient[]
  onChange: (ingredients: Ingredient[]) => void
  disabled?: boolean
  testID?: string
}

const UNIT_SUGGESTIONS = ['g', 'ml', 'tbsp', 'tsp', 'cup', 'piece']

export const IngredientsEditor: React.FC<IngredientsEditorProps> = ({
  ingredients,
  onChange,
  disabled = false,
  testID = 'ingredients-editor',
}) => {
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('')

  const handleAdd = () => {
    if (!name.trim()) return

    const newIngredient: Ingredient = {
      name: name.trim(),
      quantity: quantity.trim(),
      unit: unit.trim(),
    }

    onChange([...ingredients, newIngredient])
    setName('')
    setQuantity('')
    setUnit('')
  }

  const handleRemove = (index: number) => {
    onChange(ingredients.filter((_, i) => i !== index))
  }

  return (
    <View testID={testID} style={formStyles.formGroup}>
      <Text style={formStyles.label}>Ingredients</Text>

      {/* Input row */}
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, styles.nameInput]}
          placeholder="Name"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
          editable={!disabled}
          testID={`${testID}:name-input`}
        />
        <TextInput
          style={[styles.input, styles.quantityInput]}
          placeholder="Qty"
          placeholderTextColor={colors.textMuted}
          value={quantity}
          onChangeText={setQuantity}
          editable={!disabled}
          testID={`${testID}:quantity-input`}
        />
        <TextInput
          style={[styles.input, styles.unitInput]}
          placeholder="Unit"
          placeholderTextColor={colors.textMuted}
          value={unit}
          onChangeText={setUnit}
          editable={!disabled}
          testID={`${testID}:unit-input`}
        />
        <TouchableOpacity
          style={[styles.addButton, disabled && styles.addButtonDisabled]}
          onPress={handleAdd}
          disabled={disabled}
          testID={`${testID}:add-button`}
        >
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Unit suggestions */}
      <View style={styles.suggestions}>
        {UNIT_SUGGESTIONS.map((suggestion) => (
          <TouchableOpacity
            key={suggestion}
            style={[styles.suggestionChip, unit === suggestion && styles.suggestionChipActive]}
            onPress={() => setUnit(suggestion)}
            disabled={disabled}
            testID={`${testID}:unit-${suggestion}`}
          >
            <Text
              style={[
                styles.suggestionText,
                unit === suggestion && styles.suggestionTextActive,
              ]}
            >
              {suggestion}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Ingredient list */}
      {ingredients.map((ingredient, index) => (
        <View key={index} style={styles.ingredientItem}>
          <Text style={styles.ingredientText}>
            {ingredient.quantity} {ingredient.unit} — {ingredient.name}
          </Text>
          <TouchableOpacity
            onPress={() => handleRemove(index)}
            disabled={disabled}
            testID={`${testID}:remove-${index}`}
          >
            <Text style={styles.removeText}>Remove</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontSize: typography.sizeSm,
    color: colors.textPrimary,
    backgroundColor: colors.card,
  },
  nameInput: {
    flex: 2,
  },
  quantityInput: {
    flex: 1,
  },
  unitInput: {
    flex: 1,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: colors.background,
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  suggestionChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  suggestionChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  suggestionText: {
    fontSize: typography.sizeXs,
    color: colors.textSecondary,
  },
  suggestionTextActive: {
    color: colors.background,
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  ingredientText: {
    fontSize: typography.sizeMd,
    color: colors.textPrimary,
    flex: 1,
  },
  removeText: {
    fontSize: typography.sizeSm,
    color: colors.danger,
    fontWeight: typography.weightSemibold,
  },
})
