import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  Alert,
} from 'react-native'
import { GuideService } from '../../domain/services/GuideService'
import { AuthStorage } from '../../infrastructure/storage/AuthStorage'
import { ServerConfigStorage } from '../../infrastructure/storage/ServerConfigStorage'
import { GuideRepository } from '../../infrastructure/repositories/GuideRepository'
import { StepRepository } from '../../infrastructure/repositories/StepRepository'
import { ErrorReporter } from '../../infrastructure/monitoring/ErrorReporter'
import { SafeScreen } from '../components/SafeScreen'
import { GuideTypeSelector } from '../components/GuideTypeSelector'
import { IngredientsEditor } from '../components/IngredientsEditor'
import type { Ingredient } from '../components/IngredientsEditor'
import { InfoBanner } from '../components/InfoBanner'
import { colors } from '@guidr/shared/tokens'
import { commonStyles } from '@guidr/shared/styles/react-native'
import { formStyles } from '@guidr/shared/styles/react-native'
import { GUIDE_TYPES, GUIDE_TYPE_LABELS, type GuideType } from '../../domain/constants/GuideTypes'

interface GuideFormScreenProps {
  mode: 'create' | 'edit'
  guideId?: string
  onSave: (guideId: string) => void
  onCancel: () => void
  isAdmin: boolean
  isEditingOthersContent?: boolean
  guideService?: GuideService
  authStorage?: AuthStorage
  serverConfigStorage?: ServerConfigStorage
}

export const GuideFormScreen: React.FC<GuideFormScreenProps> = ({
  mode,
  guideId,
  onSave,
  onCancel,
  isAdmin,
  isEditingOthersContent = false,
  guideService: _guideService,
  authStorage: injectedAuthStorage,
  serverConfigStorage: injectedServerConfigStorage,
}) => {
  // Form fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedGuideType, setSelectedGuideType] = useState<GuideType | null>(null)
  const [isPublic, setIsPublic] = useState(false)
  const [isHighlighted, setIsHighlighted] = useState(false)
  const [ingredients, setIngredients] = useState<Ingredient[]>([])

  // UI states
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Services
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [guideService, setGuideService] = useState<GuideService | null>(_guideService || null)

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
          setSelectedGuideType(guide.guideType as GuideType)
          setIsPublic(guide.isPublic)
          setIsHighlighted(guide.isHighlighted)
          if (guide.metadata?.ingredients && Array.isArray(guide.metadata.ingredients)) {
            setIngredients(guide.metadata.ingredients as Ingredient[])
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
  }, [mode, guideId, guideService, authToken])

  const validateForm = (): boolean => {
    if (!title.trim()) {
      setValidationError('Guide title is required')
      return false
    }
    if (!selectedGuideType) {
      setValidationError('Guide type is required')
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
        if (!selectedGuideType) {
          setError('Guide type is required')
          return
        }
        const metadata =
          selectedGuideType === GUIDE_TYPES.COOKING && ingredients.length > 0
            ? { ingredients }
            : undefined
        const guide = await guideService.createGuide(
          selectedGuideType,
          title,
          description || undefined,
          authToken,
          undefined,
          isPublic,
          metadata
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

        // Update metadata (ingredients) for cooking guides
        if (selectedGuideType === GUIDE_TYPES.COOKING) {
          await guideService.updateGuideMetadata(
            guideId,
            { ingredients },
            authToken
          )
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
        <View style={[formStyles.container, formStyles.centerContainer]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeScreen>
    )
  }

  return (
    <SafeScreen testID="guide-form-screen">
      <ScrollView style={formStyles.scrollView}>
        <View style={formStyles.container}>
          <InfoBanner
            message="You are editing content created by another user"
            visible={mode === 'edit' && isAdmin && isEditingOthersContent}
            testID="editing-others-content-banner"
          />

          <Text style={commonStyles.titleLarge}>
            {mode === 'create' ? 'New Guide' : 'Edit Guide'}
          </Text>

          {error && <Text style={commonStyles.errorText}>{error}</Text>}
          {validationError && <Text style={commonStyles.errorText}>{validationError}</Text>}

          <View style={formStyles.formGroup}>
            <Text style={formStyles.label}>Guide Title *</Text>
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

          <View style={formStyles.formGroup}>
            <Text style={formStyles.label}>Description</Text>
            <TextInput
              style={[commonStyles.input, formStyles.descriptionInput]}
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

          <View style={formStyles.formGroup}>
            <Text style={formStyles.label}>Guide Type *</Text>
            {mode === 'create' ? (
              <GuideTypeSelector
                selectedType={selectedGuideType}
                onSelectType={setSelectedGuideType}
                disabled={saving}
                testID="guide-type-selector"
              />
            ) : (
              <View style={formStyles.typeReadOnly}>
                <Text style={formStyles.typeReadOnlyText}>
                  {selectedGuideType
                    ? GUIDE_TYPE_LABELS[selectedGuideType]
                    : 'No type selected'}
                </Text>
              </View>
            )}
          </View>

          {selectedGuideType === GUIDE_TYPES.COOKING && (
            <IngredientsEditor
              ingredients={ingredients}
              onChange={setIngredients}
              disabled={saving}
              testID="ingredients-editor"
            />
          )}

          <View style={formStyles.toggleGroup}>
            <View style={formStyles.toggleContainer}>
              <Text style={formStyles.toggleLabel}>Public Guide</Text>
              <Text style={formStyles.toggleHint}>Make this guide visible to all users</Text>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                disabled={saving}
                testID="public-toggle"
              />
            </View>
          </View>

          {isAdmin && (
            <View style={formStyles.toggleGroup}>
              <View style={formStyles.toggleContainer}>
                <Text style={formStyles.toggleLabel}>Highlight Guide</Text>
                <Text style={formStyles.toggleHint}>Featured on home screen (admin only)</Text>
                <Switch
                  value={isHighlighted}
                  onValueChange={setIsHighlighted}
                  disabled={saving}
                  testID="highlight-toggle"
                />
              </View>
            </View>
          )}

          <View style={formStyles.buttonGroup}>
            <TouchableOpacity
              style={commonStyles.button}
              onPress={handleSave}
              disabled={saving}
              testID="save-button"
            >
              <Text style={commonStyles.buttonText}>{saving ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[commonStyles.buttonSecondary, formStyles.cancelButton]}
              onPress={onCancel}
              disabled={saving}
              testID="cancel-button"
            >
              <Text style={commonStyles.buttonTextMuted}>Cancel</Text>
            </TouchableOpacity>

            {mode === 'edit' && (
              <TouchableOpacity
                style={[commonStyles.buttonDanger, formStyles.deleteButton]}
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
