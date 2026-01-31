import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Switch,
  Alert,
} from 'react-native'
import { GuideService } from '../../domain/services/GuideService'
import { CategoryService } from '../../domain/services/CategoryService'
import { AuthStorage } from '../../infrastructure/storage/AuthStorage'
import { ServerConfigStorage } from '../../infrastructure/storage/ServerConfigStorage'
import { GuideRepository } from '../../infrastructure/repositories/GuideRepository'
import { StepRepository } from '../../infrastructure/repositories/StepRepository'
import { CategoryRepository } from '../../infrastructure/repositories/CategoryRepository'
import { ErrorReporter } from '../../infrastructure/monitoring/ErrorReporter'
import { SafeScreen } from '../components/SafeScreen'
import { CategoryPickerButton } from '../components/CategoryPickerButton'
import { colors, spacing, commonStyles, typography } from '@guidr/shared/tokens'

interface GuideFormScreenProps {
  mode: 'create' | 'edit'
  guideId?: string
  categoryId?: string
  onSave: (guideId: string) => void
  onCancel: () => void
  isAdmin: boolean
  guideService?: GuideService
  categoryService?: CategoryService
  authStorage?: AuthStorage
  serverConfigStorage?: ServerConfigStorage
}

export const GuideFormScreen: React.FC<GuideFormScreenProps> = ({
  mode,
  guideId,
  categoryId: _categoryId,
  onSave,
  onCancel,
  isAdmin,
  guideService: _guideService,
  categoryService: _categoryService,
  authStorage: injectedAuthStorage,
  serverConfigStorage: injectedServerConfigStorage,
}) => {
  // Form fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(_categoryId || null)
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null)
  const [isPublic, setIsPublic] = useState(false)
  const [isHighlighted, setIsHighlighted] = useState(false)

  // UI states
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Services
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [guideService, setGuideService] = useState<GuideService | null>(_guideService || null)
  const [categoryService, setCategoryService] = useState<CategoryService | null>(_categoryService || null)

  // Initialize services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        setLoading(true)
        setError(null)

        const authStorage = injectedAuthStorage || new AuthStorage()
        const serverConfigStorage = injectedServerConfigStorage || new ServerConfigStorage()

        const token = await authStorage.getAuthToken()
        const url = await serverConfigStorage.getServerUrl()

        if (!token || !url) {
          throw new Error('Missing auth token or server URL')
        }

        setAuthToken(token)

        // Only initialize services if not provided via DI
        if (!_guideService) {
          const guideRepo = new GuideRepository(url)
          const stepRepo = new StepRepository(url)
          setGuideService(new GuideService(guideRepo, stepRepo))
        }

        if (!_categoryService) {
          const categoryRepo = new CategoryRepository(url)
          setCategoryService(new CategoryService(categoryRepo))
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error initializing services'
        setError(message)
        ErrorReporter.capture(err)
      } finally {
        setLoading(false)
      }
    }

    initializeServices()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load guide in edit mode
  useEffect(() => {
    const loadGuide = async () => {
      if (mode !== 'edit' || !guideId || !guideService || !authToken) {
        return
      }

      try {
        setLoading(true)
        const guide = await guideService.getGuideById(guideId, authToken)
        if (guide) {
          setTitle(guide.title)
          setDescription(guide.description || '')
          setSelectedCategoryId(guide.categoryId)
          setIsPublic(guide.isPublic)
          setIsHighlighted(guide.isHighlighted)

          // Load category name if categoryService is available
          if (categoryService) {
            const categories = await categoryService.getAllCategories(authToken)
            const category = categories.find((c) => c.id === guide.categoryId)
            if (category) {
              setSelectedCategoryName(category.name)
            }
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error loading guide'
        setError(message)
        ErrorReporter.capture(err)
      } finally {
        setLoading(false)
      }
    }

    loadGuide()
  }, [mode, guideId, guideService, categoryService, authToken])

  const validateForm = (): boolean => {
    if (!title.trim()) {
      setValidationError('Guide title is required')
      return false
    }
    if (!selectedCategoryId) {
      setValidationError('Category is required')
      return false
    }
    setValidationError(null)
    return true
  }

  const handleSave = async () => {
    if (!validateForm()) {
      return
    }

    if (!guideService || !authToken) {
      setError('Services not initialized')
      return
    }

    try {
      setSaving(true)
      setError(null)

      if (mode === 'create') {
        if (!selectedCategoryId) {
          setError('Category is required')
          return
        }
        const guide = await guideService.createGuide(
          selectedCategoryId,
          title,
          description || undefined,
          authToken,
          undefined,
          isPublic
        )
        onSave(guide.id)
      } else if (guideId) {
        // Update title
        if (title) {
          await guideService.updateGuideTitle(guideId, title, authToken)
        }

        // Update description
        if (description) {
          await guideService.updateGuideDescription(guideId, description, authToken)
        }

        // Update visibility
        await guideService.toggleVisibility(guideId, isPublic, authToken)

        // Update highlight only if admin
        if (isAdmin) {
          await guideService.toggleHighlight(guideId, isHighlighted, authToken)
        }

        onSave(guideId)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error saving guide'
      setError(message)
      ErrorReporter.capture(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = () => {
    Alert.alert(
      'Delete Guide',
      'Are you sure you want to delete this guide? This action cannot be undone.',
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            if (!guideService || !authToken || !guideId) {
              setError('Services not initialized')
              return
            }

            try {
              setSaving(true)
              setError(null)
              await guideService.deleteGuide(guideId, authToken)
              onSave(guideId)
            } catch (err) {
              const message = err instanceof Error ? err.message : 'Error deleting guide'
              setError(message)
              ErrorReporter.capture(err)
            } finally {
              setSaving(false)
            }
          },
          style: 'destructive',
        },
      ]
    )
  }

  if (loading) {
    return (
      <SafeScreen testID="guide-form-screen">
        <View style={[styles.container, styles.centerContainer]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeScreen>
    )
  }

  return (
    <SafeScreen testID="guide-form-screen">
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          <Text style={commonStyles.titleLarge}>
            {mode === 'create' ? 'New Guide' : 'Edit Guide'}
          </Text>

          {error && <Text style={commonStyles.errorText}>{error}</Text>}
          {validationError && <Text style={commonStyles.errorText}>{validationError}</Text>}

          <View style={styles.formGroup}>
            <Text style={styles.label}>Guide Title *</Text>
            <TextInput
              style={commonStyles.input}
              placeholder="Enter guide title"
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
              testID="guide-title-input"
              editable={!saving}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[commonStyles.input, styles.descriptionInput]}
              placeholder="Enter guide description"
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
              testID="guide-description-input"
              multiline
              numberOfLines={4}
              editable={!saving}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Category *</Text>
            {mode === 'create' && categoryService && authToken ? (
              <CategoryPickerButton
                selectedCategoryId={selectedCategoryId}
                onSelectCategory={setSelectedCategoryId}
                authToken={authToken}
                categoryService={categoryService}
                disabled={saving}
              />
            ) : (
              <View style={styles.categoryReadOnly}>
                <Text style={styles.categoryReadOnlyText}>
                  {selectedCategoryName || 'No category selected'}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.toggleGroup}>
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleLabel}>Public Guide</Text>
              <Text style={styles.toggleHint}>Make this guide visible to all users</Text>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                disabled={saving}
                testID="public-toggle"
              />
            </View>
          </View>

          {isAdmin && (
            <View style={styles.toggleGroup}>
              <View style={styles.toggleContainer}>
                <Text style={styles.toggleLabel}>Highlight Guide</Text>
                <Text style={styles.toggleHint}>Featured on home screen (admin only)</Text>
                <Switch
                  value={isHighlighted}
                  onValueChange={setIsHighlighted}
                  disabled={saving}
                  testID="highlight-toggle"
                />
              </View>
            </View>
          )}

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={commonStyles.button}
              onPress={handleSave}
              disabled={saving}
              testID="save-button"
            >
              <Text style={commonStyles.buttonText}>{saving ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[commonStyles.buttonSecondary, styles.cancelButton]}
              onPress={onCancel}
              disabled={saving}
              testID="cancel-button"
            >
              <Text style={commonStyles.buttonTextMuted}>Cancel</Text>
            </TouchableOpacity>

            {mode === 'edit' && (
              <TouchableOpacity
                style={[commonStyles.buttonDanger, styles.deleteButton]}
                onPress={handleDelete}
                disabled={saving}
                testID="delete-button"
              >
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
  centerContainer: { justifyContent: 'center', alignItems: 'center' },
  formGroup: { marginTop: spacing.xl, marginBottom: spacing.lg },
  label: {
    fontSize: typography.sizeMd,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  descriptionInput: { minHeight: 100, textAlignVertical: 'top' },
  categoryReadOnly: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    justifyContent: 'center',
  },
  categoryReadOnlyText: {
    fontSize: typography.sizeMd,
    color: colors.textSecondary,
  },
  toggleGroup: { marginTop: spacing.xl, marginBottom: spacing.lg },
  toggleContainer: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: typography.sizeMd,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  toggleHint: {
    fontSize: typography.sizeSm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    flex: 1,
  },
  buttonGroup: { marginTop: spacing.xl, gap: spacing.md },
  cancelButton: { marginTop: spacing.md },
  deleteButton: { marginTop: spacing.md },
})
