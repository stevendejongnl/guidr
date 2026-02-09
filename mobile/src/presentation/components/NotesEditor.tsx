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

export interface Note {
  key: string
  value: string
}

interface NotesEditorProps {
  notes: Note[]
  onChange: (notes: Note[]) => void
  disabled?: boolean
  testID?: string
}

const KEY_SUGGESTIONS = ['difficulty', 'duration', 'category', 'level']

export const NotesEditor: React.FC<NotesEditorProps> = ({
  notes,
  onChange,
  disabled = false,
  testID = 'notes-editor',
}) => {
  const [noteKey, setNoteKey] = useState('')
  const [noteValue, setNoteValue] = useState('')

  const handleAdd = () => {
    if (!noteKey.trim()) return

    const newNote: Note = {
      key: noteKey.trim(),
      value: noteValue.trim(),
    }

    onChange([...notes, newNote])
    setNoteKey('')
    setNoteValue('')
  }

  const handleRemove = (index: number) => {
    onChange(notes.filter((_, i) => i !== index))
  }

  return (
    <View testID={testID} style={formStyles.formGroup}>
      <Text style={formStyles.label}>Notes</Text>

      {/* Input row */}
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, styles.keyInput]}
          placeholder="Key"
          placeholderTextColor={colors.textMuted}
          value={noteKey}
          onChangeText={setNoteKey}
          editable={!disabled}
          testID={`${testID}:key-input`}
        />
        <TextInput
          style={[styles.input, styles.valueInput]}
          placeholder="Value"
          placeholderTextColor={colors.textMuted}
          value={noteValue}
          onChangeText={setNoteValue}
          editable={!disabled}
          testID={`${testID}:value-input`}
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

      {/* Key suggestions */}
      <View style={styles.suggestions}>
        {KEY_SUGGESTIONS.map((suggestion) => (
          <TouchableOpacity
            key={suggestion}
            style={[styles.suggestionChip, noteKey === suggestion && styles.suggestionChipActive]}
            onPress={() => setNoteKey(suggestion)}
            disabled={disabled}
            testID={`${testID}:key-${suggestion}`}
          >
            <Text
              style={[
                styles.suggestionText,
                noteKey === suggestion && styles.suggestionTextActive,
              ]}
            >
              {suggestion}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Notes list */}
      {notes.map((note, index) => (
        <View key={index} style={styles.noteItem}>
          <Text style={styles.noteText}>
            {note.key}: {note.value}
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
  keyInput: {
    flex: 1,
  },
  valueInput: {
    flex: 2,
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
  noteItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  noteText: {
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
