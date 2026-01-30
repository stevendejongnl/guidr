import React, { useState } from 'react'
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { GuideService } from '../../domain/services/GuideService'
import { CategoryService } from '../../domain/services/CategoryService'
import { SafeScreen } from '../components/SafeScreen'
import { colors, spacing, commonStyles, typography } from '../theme'

interface GuideFormScreenProps {
  mode: 'create' | 'edit'
  guideId?: string
  categoryId?: string
  onSave: (guideId: string) => void
  onCancel: () => void
  guideService?: GuideService
  categoryService?: CategoryService
}

export const GuideFormScreen: React.FC<GuideFormScreenProps> = ({
  mode,
  guideId,
  categoryId: _categoryId,
  onSave,
  onCancel,
  guideService: _guideService,
  categoryService: _categoryService,
}) => {
  const [title, setTitle] = useState('')

  return (
    <SafeScreen testID="guide-form-screen">
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          <Text style={commonStyles.titleLarge}>
            {mode === 'create' ? 'New Guide' : 'Edit Guide'}
          </Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Guide Title</Text>
            <TextInput
              style={commonStyles.input}
              placeholder="Enter guide title"
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
              testID="guide-title-input"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Category</Text>
          </View>

          <View style={styles.buttonGroup}>
            <TouchableOpacity style={commonStyles.button} onPress={() => onSave(guideId || 'new')}>
              <Text style={commonStyles.buttonText}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[commonStyles.buttonSecondary, styles.cancelButton]} onPress={onCancel}>
              <Text style={commonStyles.buttonTextMuted}>Cancel</Text>
            </TouchableOpacity>

            {mode === 'edit' && (
              <TouchableOpacity style={[commonStyles.buttonDanger, styles.deleteButton]} onPress={onCancel}>
                <Text style={commonStyles.buttonText}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeScreen>
  )
}

const styles = StyleSheet.create({
  scrollView: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  formGroup: { marginTop: spacing.xl, marginBottom: spacing.lg },
  label: { fontSize: typography.sizeMd, color: colors.textPrimary, marginBottom: spacing.sm, fontWeight: '600' },
  buttonGroup: { marginTop: spacing.xl, gap: spacing.md },
  cancelButton: { marginTop: spacing.md },
  deleteButton: { marginTop: spacing.md },
})
