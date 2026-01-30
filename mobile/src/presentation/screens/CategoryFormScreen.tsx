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
} from 'react-native'
import { AuthStorage } from '../../infrastructure/storage/AuthStorage'
import { CategoryService } from '../../domain/services/CategoryService'
import { CategoryRepository } from '../../infrastructure/repositories/CategoryRepository'
import { ServerConfigStorage } from '../../infrastructure/storage/ServerConfigStorage'
import { SafeScreen } from '../components/SafeScreen'
import { ErrorReporter } from '../../infrastructure/monitoring/ErrorReporter'
import { colors, spacing, commonStyles, typography } from '../theme'

interface CategoryFormScreenProps {
  mode: 'create' | 'edit'
  categoryId?: string
  parentId?: string | null
  onSave: (categoryId: string) => void
  onCancel: () => void
  isAdmin?: boolean
  // Optional dependency injection
  categoryService?: CategoryService
  authStorage?: AuthStorage
  serverConfigStorage?: ServerConfigStorage
}

export const CategoryFormScreen: React.FC<CategoryFormScreenProps> = ({
  mode,
  categoryId,
  parentId = null,
  onSave,
  onCancel,
  isAdmin = false,
  categoryService: injectedCategoryService,
  authStorage: injectedAuthStorage,
  serverConfigStorage: injectedServerConfigStorage,
}) => {
  const [name, setName] = useState('')
  const [selectedParentId, setSelectedParentId] = useState<string | null>(parentId || null)
  const [loading, setLoading] = useState(mode === 'edit')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [showAdminError, setShowAdminError] = useState(!isAdmin && mode === 'create')

  const authStorage = injectedAuthStorage || new AuthStorage()
  const serverConfigStorage = injectedServerConfigStorage || new ServerConfigStorage()

  // Initialize service (use injected or create new)
  const servicesRef = React.useRef<{
    categoryService: CategoryService
  } | null>(null)

  const getServices = (serverUrl: string) => {
    if (servicesRef.current) {
      return servicesRef.current
    }

    if (injectedCategoryService) {
      servicesRef.current = {
        categoryService: injectedCategoryService,
      }
      return servicesRef.current
    }

    const repository = new CategoryRepository(serverUrl)
    servicesRef.current = {
      categoryService: new CategoryService(repository),
    }
    return servicesRef.current
  }

  useEffect(() => {
    if (!isAdmin && mode === 'create') {
      setShowAdminError(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (mode === 'edit' && categoryId) {
      loadCategory()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, categoryId, injectedCategoryService])

  const loadCategory = async () => {
    try {
      setError(null)

      const authToken = await authStorage.getAuthToken()
      if (!authToken) throw new Error('No auth token found')

      const serverUrl = await serverConfigStorage.getServerUrl()
      if (!serverUrl) throw new Error('No server URL configured')

      const services = getServices(serverUrl)
      const service = services.categoryService

      const category = await service.getCategoryById(categoryId as string, authToken)
      if (!category) {
        throw new Error('Category not found')
      }

      setName(category.name)
      setSelectedParentId(category.parentId)
    } catch (err) {
      ErrorReporter.capture(err, { component: 'CategoryFormScreen', action: 'loadCategory' })
      console.error('Failed to load category:', err)
      setError(err instanceof Error ? err.message : 'Failed to load category')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = (): boolean => {
    if (!name || name.trim() === '') {
      setValidationError('Category name is required')
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

      const services = getServices(serverUrl)
      const service = services.categoryService

      if (mode === 'create') {
        const newCategory = await service.createCategory(name, selectedParentId, authToken)
        onSave(newCategory.id)
      } else if (mode === 'edit' && categoryId) {
        await service.updateCategoryName(categoryId, name, authToken)
        onSave(categoryId)
      }
    } catch (err) {
      ErrorReporter.capture(err, { component: 'CategoryFormScreen', action: 'handleSave' })
      console.error('Failed to save category:', err)
      setError(err instanceof Error ? err.message : 'Failed to save category')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = () => {
    if (mode !== 'edit' || !categoryId) return

    Alert.alert(
      'Delete Category',
      'Are you sure you want to delete this category? This action cannot be undone.',
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

              const services = getServices(serverUrl)
              const service = services.categoryService
              await service.deleteCategory(categoryId, authToken)

              onSave(categoryId)
            } catch (err) {
              ErrorReporter.capture(err, { component: 'CategoryFormScreen', action: 'handleDelete' })
              console.error('Failed to delete category:', err)
              setError(err instanceof Error ? err.message : 'Failed to delete category')
              setSaving(false)
            }
          },
        },
      ]
    )
  }

  if (loading) {
    return (
      <SafeScreen testID="category-form-screen">
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeScreen>
    )
  }

  if (showAdminError) {
    return (
      <SafeScreen testID="category-form-screen">
        <View style={commonStyles.loadingContainer}>
          <Text style={[commonStyles.errorText, { textAlign: 'center', marginHorizontal: spacing.xl }]}>
            Only administrators can create or edit categories.
          </Text>
          <TouchableOpacity
            style={[commonStyles.buttonSecondary, { marginTop: spacing.xl, marginHorizontal: spacing.xl }]}
            onPress={onCancel}
          >
            <Text style={commonStyles.buttonTextMuted}>Back</Text>
          </TouchableOpacity>
        </View>
      </SafeScreen>
    )
  }

  return (
    <SafeScreen testID="category-form-screen">
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          {/* Header */}
          <Text style={commonStyles.titleLarge}>
            {mode === 'create' ? 'New Category' : 'Edit Category'}
          </Text>

          {error && <Text style={commonStyles.errorText}>{error}</Text>}

          {/* Name Input */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Category Name</Text>
            <TextInput
              style={[commonStyles.input, validationError && commonStyles.inputError]}
              placeholder="Enter category name"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
              editable={!saving}
              testID="category-name-input"
            />
            {validationError && (
              <Text style={commonStyles.errorText}>{validationError}</Text>
            )}
          </View>

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
