import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native'
import { AuthStorage } from '../../infrastructure/storage/AuthStorage'
import { GuideService } from '../../domain/services/GuideService'
import { CategoryService } from '../../domain/services/CategoryService'
import { GuideRepository } from '../../infrastructure/repositories/GuideRepository'
import { StepRepository } from '../../infrastructure/repositories/StepRepository'
import { CategoryRepository } from '../../infrastructure/repositories/CategoryRepository'
import { ServerConfigStorage } from '../../infrastructure/storage/ServerConfigStorage'
import { SafeScreen } from '../components/SafeScreen'
import { CategoryPickerButton } from '../components/CategoryPickerButton'
import { ErrorReporter } from '../../infrastructure/monitoring/ErrorReporter'
import { colors, spacing, commonStyles, typography } from '../theme'

interface GuideFormScreenProps {
  mode: 'create' | 'edit'
  guideId?: string
  categoryId?: string
  onSave: (guideId: string) => void
  onCancel: () => void
}

export const GuideFormScreen: React.FC<GuideFormScreenProps> = ({
  mode,
  guideId,
  categoryId = undefined,
  onSave,
  onCancel,
}) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(categoryId || null)
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null)
  const [isPublic, setIsPublic] = useState(false)
  const [isHighlighted, setIsHighlighted] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(mode === 'edit')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  const authStorage = new AuthStorage()
  const serverConfigStorage = new ServerConfigStorage()
  const [authToken, setAuthToken] = useState<string>('')
  const [serverUrl, setServerUrl] = useState<string>('')

  useEffect(() => {
    const setupServices = async () => {
      const token = await authStorage.getAuthToken()
      const url = await serverConfigStorage.getServerUrl()
      const isUserAdmin = await authStorage.getUserIsAdmin()
      if (token) setAuthToken(token)
      if (url) setServerUrl(url)
      if (isUserAdmin) setIsAdmin(isUserAdmin)
    }
    setupServices()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (mode === 'edit' && guideId) {
      loadGuide()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, guideId])

  const loadGuide = async () => {
    try {
      setError(null)

      const authToken = await authStorage.getAuthToken()
      if (!authToken) throw new Error('No auth token found')

      const serverUrl = await serverConfigStorage.getServerUrl()
      if (!serverUrl) throw new Error('No server URL configured')

      const guideRepository = new GuideRepository(serverUrl)
      const stepRepository = new StepRepository(serverUrl)
      const categoryRepository = new CategoryRepository(serverUrl)
      const guideService = new GuideService(guideRepository, stepRepository)
      const categoryService = new CategoryService(categoryRepository)

      const guide = await guideService.getGuideById(guideId as string, authToken)
      if (!guide) {
        throw new Error('Guide not found')
      }

      setTitle(guide.title)
      setDescription(guide.description || '')
      setSelectedCategoryId(guide.categoryId)
      setIsPublic(guide.isPublic)
      setIsHighlighted(guide.isHighlighted)

      // Load category name for display in edit mode
      const category = await categoryService.getCategoryById(guide.categoryId, authToken)
      if (category) {
        setSelectedCategoryName(category.name)
      }
    } catch (err) {
      ErrorReporter.capture(err, { component: 'GuideFormScreen', action: 'loadGuide' })
      console.error('Failed to load guide:', err)
      setError(err instanceof Error ? err.message : 'Failed to load guide')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = (): boolean => {
    if (!title || title.trim() === '') {
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

    setSaving(true)
    try {
      setError(null)

      const authToken = await authStorage.getAuthToken()
      if (!authToken) throw new Error('No auth token found')

      const serverUrl = await serverConfigStorage.getServerUrl()
      if (!serverUrl) throw new Error('No server URL configured')

      const guideRepository = new GuideRepository(serverUrl)
      const stepRepository = new StepRepository(serverUrl)
      const service = new GuideService(guideRepository, stepRepository)

      if (mode === 'create') {
        const userId = await authStorage.getUserId()
        const newGuide = await service.createGuide(
          selectedCategoryId as string,
          title,
          description || undefined,
          authToken,
          userId || undefined,
          isPublic
        )
        onSave(newGuide.id)
      } else if (mode === 'edit' && guideId) {
        const guide = await service.getGuideById(guideId, authToken)
        if (!guide) throw new Error('Guide not found')

        await service.updateGuideTitle(guideId, title, authToken)
        if (description !== undefined) {
          await service.updateGuideDescription(guideId, description, authToken)
        }
        if (guide.isPublic !== isPublic) {
          await service.toggleVisibility(guideId, isPublic, authToken)
        }
        if (isAdmin && guide.isHighlighted !== isHighlighted) {
          await service.toggleHighlight(guideId, isHighlighted, authToken)
        }
        onSave(guideId)
      }
    } catch (err) {
      ErrorReporter.capture(err, { component: 'GuideFormScreen', action: 'handleSave' })
      console.error('Failed to save guide:', err)
      setError(err instanceof Error ? err.message : 'Failed to save guide')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = () => {
    if (mode !== 'edit' || !guideId) return

    Alert.alert(
      'Delete Guide',
      'Are you sure you want to delete this guide? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setSaving(true)
            try {
              const authToken = await authStorage.getAuthToken()
              if (!authToken) throw new Error('No auth token found')

              const serverUrl = await serverConfigStorage.getServerUrl()
              if (!serverUrl) throw new Error('No server URL configured')

              const guideRepository = new GuideRepository(serverUrl)
              const stepRepository = new StepRepository(serverUrl)
              const service = new GuideService(guideRepository, stepRepository)
              await service.deleteGuide(guideId, authToken)

              onSave(guideId)
            } catch (err) {
              ErrorReporter.capture(err, { component: 'GuideFormScreen', action: 'handleDelete' })
              console.error('Failed to delete guide:', err)
              setError(err instanceof Error ? err.message : 'Failed to delete guide')
              setSaving(false)
            }
          },
        },
      ]
    )
  }

  if (loading) {
    return (
      <SafeScreen testID="guide-form-screen">
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeScreen>
    )
  }

  return (
    <SafeScreen testID="guide-form-screen">
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          {/* Header */}
          <Text style={commonStyles.titleLarge}>
            {mode === 'create' ? 'New Guide' : 'Edit Guide'}
          </Text>

          {error && <Text style={commonStyles.errorText}>{error}</Text>}

          {/* Title Input */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Guide Title</Text>
            <TextInput
              style={[commonStyles.input, validationError === 'Guide title is required' && commonStyles.inputError]}
              placeholder="Enter guide title"
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
              editable={!saving}
              testID="guide-title-input"
            />
            {validationError === 'Guide title is required' && (
              <Text style={commonStyles.errorText}>{validationError}</Text>
            )}
          </View>

          {/* Description Input */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[commonStyles.input, { minHeight: 100 }]}
              placeholder="Enter guide description (optional)"
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
              editable={!saving}
              multiline
              testID="guide-description-input"
            />
          </View>

          {/* Category Selection */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Category</Text>
            {mode === 'create' ? (
              authToken && serverUrl ? (
                <CategoryPickerButton
                  selectedCategoryId={selectedCategoryId}
                  onSelectCategory={setSelectedCategoryId}
                  authToken={authToken}
                  categoryService={new CategoryService(new CategoryRepository(serverUrl))}
                  disabled={saving}
                />
              ) : (
                <View style={styles.categoryReadOnly}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              )
            ) : (
              <View style={styles.categoryReadOnly}>
                <Text style={styles.categoryReadOnlyText}>{selectedCategoryName || selectedCategoryId}</Text>
              </View>
            )}
            {validationError === 'Category is required' && (
              <Text style={commonStyles.errorText}>{validationError}</Text>
            )}
          </View>

          {/* Visibility Toggle */}
          <View style={styles.toggleGroup}>
            <Text style={styles.label}>Visibility</Text>
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleLabel}>{isPublic ? 'Public' : 'Private'}</Text>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                disabled={saving}
                testID="guide-visibility-toggle"
              />
            </View>
            <Text style={styles.toggleHint}>
              {isPublic ? 'Anyone can view this guide' : 'Only you and admins can view this guide'}
            </Text>
          </View>

          {/* Highlight Toggle (Admin Only) */}
          {isAdmin && (
            <View style={styles.toggleGroup}>
              <Text style={styles.label}>Featured</Text>
              <View style={styles.toggleContainer}>
                <Text style={styles.toggleLabel}>{isHighlighted ? 'Featured' : 'Not Featured'}</Text>
                <Switch
                  value={isHighlighted}
                  onValueChange={setIsHighlighted}
                  disabled={saving}
                  testID="guide-highlight-toggle"
                />
              </View>
              <Text style={styles.toggleHint}>
                {isHighlighted ? 'This guide appears on the home screen' : 'This guide is not featured'}
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[commonStyles.button, saving && commonStyles.buttonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={colors.textPrimary} style={commonStyles.activityIndicator} />
              ) : null}
              <Text style={commonStyles.buttonText}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[commonStyles.buttonSecondary, styles.cancelButton]}
              onPress={onCancel}
              disabled={saving}
            >
              <Text style={commonStyles.buttonTextMuted}>Cancel</Text>
            </TouchableOpacity>

            {mode === 'edit' && (
              <TouchableOpacity
                style={[commonStyles.buttonDanger, styles.deleteButton]}
                onPress={handleDelete}
                disabled={saving}
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
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  formGroup: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.sizeMd,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  categoryInfo: {
    fontSize: typography.sizeMd,
    color: colors.textSecondary,
    padding: spacing.md,
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
  },
  categoryReadOnly: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    minHeight: 44,
  },
  categoryReadOnlyText: {
    fontSize: typography.sizeMd,
    color: colors.textPrimary,
  },
  toggleGroup: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  toggleLabel: {
    fontSize: typography.sizeMd,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  toggleHint: {
    fontSize: typography.sizeSm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  buttonGroup: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  cancelButton: {
    marginTop: spacing.md,
  },
  deleteButton: {
    marginTop: spacing.md,
  },
})
