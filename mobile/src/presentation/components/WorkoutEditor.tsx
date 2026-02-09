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

export interface TargetMuscle {
  name: string
  focus: string
}

export interface Equipment {
  name: string
  weight: string
}

interface WorkoutEditorProps {
  targetMuscles: TargetMuscle[]
  equipment: Equipment[]
  onChangeTargetMuscles: (muscles: TargetMuscle[]) => void
  onChangeEquipment: (equipment: Equipment[]) => void
  disabled?: boolean
  testID?: string
}

const FOCUS_OPTIONS = ['primary', 'secondary']
const MUSCLE_SUGGESTIONS = ['chest', 'back', 'shoulders', 'legs', 'arms', 'core']

export const WorkoutEditor: React.FC<WorkoutEditorProps> = ({
  targetMuscles,
  equipment,
  onChangeTargetMuscles,
  onChangeEquipment,
  disabled = false,
  testID = 'workout-editor',
}) => {
  const [muscleName, setMuscleName] = useState('')
  const [muscleFocus, setMuscleFocus] = useState('primary')
  const [equipmentName, setEquipmentName] = useState('')
  const [equipmentWeight, setEquipmentWeight] = useState('')

  const handleAddMuscle = () => {
    if (!muscleName.trim()) return

    const newMuscle: TargetMuscle = {
      name: muscleName.trim(),
      focus: muscleFocus,
    }

    onChangeTargetMuscles([...targetMuscles, newMuscle])
    setMuscleName('')
    setMuscleFocus('primary')
  }

  const handleRemoveMuscle = (index: number) => {
    onChangeTargetMuscles(targetMuscles.filter((_, i) => i !== index))
  }

  const handleAddEquipment = () => {
    if (!equipmentName.trim()) return

    const newEquipment: Equipment = {
      name: equipmentName.trim(),
      weight: equipmentWeight.trim(),
    }

    onChangeEquipment([...equipment, newEquipment])
    setEquipmentName('')
    setEquipmentWeight('')
  }

  const handleRemoveEquipment = (index: number) => {
    onChangeEquipment(equipment.filter((_, i) => i !== index))
  }

  return (
    <View testID={testID}>
      {/* Target Muscles Section */}
      <View style={formStyles.formGroup}>
        <Text style={formStyles.label}>Target Muscles</Text>

        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, styles.nameInput]}
            placeholder="Muscle name"
            placeholderTextColor={colors.textMuted}
            value={muscleName}
            onChangeText={setMuscleName}
            editable={!disabled}
            testID={`${testID}:muscle-name-input`}
          />
          <TouchableOpacity
            style={[styles.addButton, disabled && styles.addButtonDisabled]}
            onPress={handleAddMuscle}
            disabled={disabled}
            testID={`${testID}:add-muscle-button`}
          >
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Focus quick-picks */}
        <View style={styles.suggestions}>
          {FOCUS_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.suggestionChip, muscleFocus === option && styles.suggestionChipActive]}
              onPress={() => setMuscleFocus(option)}
              disabled={disabled}
              testID={`${testID}:focus-${option}`}
            >
              <Text
                style={[
                  styles.suggestionText,
                  muscleFocus === option && styles.suggestionTextActive,
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Muscle suggestions */}
        <View style={styles.suggestions}>
          {MUSCLE_SUGGESTIONS.map((suggestion) => (
            <TouchableOpacity
              key={suggestion}
              style={[styles.suggestionChip, muscleName === suggestion && styles.suggestionChipActive]}
              onPress={() => setMuscleName(suggestion)}
              disabled={disabled}
              testID={`${testID}:muscle-${suggestion}`}
            >
              <Text
                style={[
                  styles.suggestionText,
                  muscleName === suggestion && styles.suggestionTextActive,
                ]}
              >
                {suggestion}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Muscle list */}
        {targetMuscles.map((muscle, index) => (
          <View key={index} style={styles.listItem}>
            <Text style={styles.itemText}>
              {muscle.name} ({muscle.focus})
            </Text>
            <TouchableOpacity
              onPress={() => handleRemoveMuscle(index)}
              disabled={disabled}
              testID={`${testID}:remove-muscle-${index}`}
            >
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Equipment Section */}
      <View style={formStyles.formGroup}>
        <Text style={formStyles.label}>Equipment</Text>

        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, styles.nameInput]}
            placeholder="Equipment name"
            placeholderTextColor={colors.textMuted}
            value={equipmentName}
            onChangeText={setEquipmentName}
            editable={!disabled}
            testID={`${testID}:equipment-name-input`}
          />
          <TextInput
            style={[styles.input, styles.weightInput]}
            placeholder="Weight"
            placeholderTextColor={colors.textMuted}
            value={equipmentWeight}
            onChangeText={setEquipmentWeight}
            editable={!disabled}
            testID={`${testID}:equipment-weight-input`}
          />
          <TouchableOpacity
            style={[styles.addButton, disabled && styles.addButtonDisabled]}
            onPress={handleAddEquipment}
            disabled={disabled}
            testID={`${testID}:add-equipment-button`}
          >
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Equipment list */}
        {equipment.map((item, index) => (
          <View key={index} style={styles.listItem}>
            <Text style={styles.itemText}>
              {item.name} — {item.weight}
            </Text>
            <TouchableOpacity
              onPress={() => handleRemoveEquipment(index)}
              disabled={disabled}
              testID={`${testID}:remove-equipment-${index}`}
            >
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
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
  weightInput: {
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
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemText: {
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
