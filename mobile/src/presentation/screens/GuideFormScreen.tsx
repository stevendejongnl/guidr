import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  StyleSheet,
} from 'react-native'
import { GuideService } from '../../domain/services/GuideService'
import { StepService } from '../../domain/services/StepService'
import { Step } from '../../domain/entities/Step'
import { AuthStorage } from '../../infrastructure/storage/AuthStorage'
import { ServerConfigStorage } from '../../infrastructure/storage/ServerConfigStorage'
import { GuideRepository } from '../../infrastructure/repositories/GuideRepository'
import { StepRepository } from '../../infrastructure/repositories/StepRepository'
import { ErrorReporter } from '../../infrastructure/monitoring/ErrorReporter'
import { SafeScreen } from '../components/SafeScreen'
import { GuideTypeSelector } from '../components/GuideTypeSelector'
import { IngredientsEditor } from '../components/IngredientsEditor'
import type { Ingredient } from '../components/IngredientsEditor'
import { WorkoutEditor } from '../components/WorkoutEditor'
import type { TargetMuscle, Equipment } from '../components/WorkoutEditor'
import { NotesEditor } from '../components/NotesEditor'
import type { Note } from '../components/NotesEditor'
import { InfoBanner } from '../components/InfoBanner'
import { StepListItem } from '../components/StepListItem'
import { ContentLoader } from '../components/ContentLoader'
import { SkeletonCard, SkeletonLines, SkeletonList } from '../components/Skeleton'
import { colors, spacing, typography } from '@guidr/shared/tokens'
import { commonStyles } from '@guidr/shared/styles/react-native'
import { formStyles } from '@guidr/shared/styles/react-native'
import { GUIDE_TYPES, GUIDE_TYPE_LABELS, type GuideType } from '../../domain/constants/GuideTypes'
import { DEFAULT_LANGUAGE } from '../../domain/constants/Languages'
import { LanguageSelector } from '../components/LanguageSelector'

interface GuideFormScreenProps {
  mode: 'create' | 'edit'
  guideId?: string
  onSave: (guideId: string) => void
  onCancel: () => void
  isAdmin: boolean
  isEditingOthersContent?: boolean
  guideService?: GuideService
  stepService?: StepService
  onAddStep?: (guideId: string, stepCount: number) => void
  onEditStep?: (stepId: string) => void
  stepsRefreshKey?: number
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
  stepService: _stepService,
  onAddStep,
  onEditStep,
  stepsRefreshKey = 0,
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
  const [targetMuscles, setTargetMuscles] = useState<TargetMuscle[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedLanguage, setSelectedLanguage] = useState(DEFAULT_LANGUAGE)

  // UI states
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Step states
  const [steps, setSteps] = useState<Step[]>([])
  const [loadingSteps, setLoadingSteps] = useState(false)

  // Services
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [guideService, setGuideService] = useState<GuideService | null>(_guideService || null)
  const [stepService, setStepService] = useState<StepService | null>(_stepService || null)

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
        if (!_guideService || !_stepService) {
          const guideRepo = new GuideRepository(url)
          const stepRepo = new StepRepository(url)
          if (!_guideService) {
            setGuideService(new GuideService(guideRepo, stepRepo))
          }
          if (!_stepService) {
            setStepService(new StepService(stepRepo))
          }
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
          setSelectedLanguage(guide.language || DEFAULT_LANGUAGE)
          if (guide.metadata?.ingredients && Array.isArray(guide.metadata.ingredients)) {
            setIngredients(guide.metadata.ingredients as Ingredient[])
          }
          if (guide.metadata?.target_muscles && Array.isArray(guide.metadata.target_muscles)) {
            setTargetMuscles(guide.metadata.target_muscles as TargetMuscle[])
          }
          if (guide.metadata?.equipment && Array.isArray(guide.metadata.equipment)) {
            setEquipment(guide.metadata.equipment as Equipment[])
          }
          if (guide.metadata?.notes && Array.isArray(guide.metadata.notes)) {
            setNotes(guide.metadata.notes as Note[])
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

  // Load steps in edit mode
  useEffect(() => {
    const loadSteps = async () => {
      if (mode !== 'edit' || !guideId || !stepService || !authToken) {
        return
      }

      try {
        setLoadingSteps(true)
        const loadedSteps = await stepService.getStepsByGuideId(guideId, authToken)
        setSteps(loadedSteps)
      } catch (err) {
        ErrorReporter.capture(err, { component: 'GuideFormScreen', action: 'loadSteps' })
        console.error('Failed to load steps:', err)
      } finally {
        setLoadingSteps(false)
      }
    }

    loadSteps()
  }, [mode, guideId, stepService, authToken, stepsRefreshKey])

  const handleAddStep = () => {
    if (onAddStep && guideId) {
      onAddStep(guideId, steps.length)
    }
  }

  const handleEditStep = (stepId: string) => {
    if (onEditStep) {
      onEditStep(stepId)
    }
  }

  const handleDeleteStep = (stepId: string) => {
    Alert.alert(
      'Delete Step',
      'Are you sure you want to delete this step?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!stepService || !authToken) return
              await stepService.deleteStep(stepId, authToken)
              if (!guideId) return
              const reloaded = await stepService.getStepsByGuideId(guideId, authToken)
              setSteps(reloaded)
            } catch (err) {
              ErrorReporter.capture(err, { component: 'GuideFormScreen', action: 'handleDeleteStep' })
              console.error('Failed to delete step:', err)
              Alert.alert('Error', 'Failed to delete step')
            }
          },
        },
      ]
    )
  }

  const handleMoveStepUp = async (stepId: string) => {
    try {
      if (!stepService || !authToken) return

      const sortedSteps = [...steps].sort((a, b) => a.order - b.order)
      const currentIndex = sortedSteps.findIndex((s) => s.id === stepId)

      if (currentIndex > 0) {
        const currentStep = sortedSteps[currentIndex]
        const previousStep = sortedSteps[currentIndex - 1]

        if (currentStep && previousStep) {
          await stepService.updateStepOrder(currentStep.id, previousStep.order, authToken)
          await stepService.updateStepOrder(previousStep.id, currentStep.order, authToken)
          if (guideId) {
            const reloaded = await stepService.getStepsByGuideId(guideId, authToken)
            setSteps(reloaded)
          }
        }
      }
    } catch (err) {
      ErrorReporter.capture(err, { component: 'GuideFormScreen', action: 'handleMoveStepUp' })
      console.error('Failed to move step up:', err)
      Alert.alert('Error', 'Failed to reorder steps')
    }
  }

  const handleMoveStepDown = async (stepId: string) => {
    try {
      if (!stepService || !authToken) return

      const sortedSteps = [...steps].sort((a, b) => a.order - b.order)
      const currentIndex = sortedSteps.findIndex((s) => s.id === stepId)

      if (currentIndex < sortedSteps.length - 1) {
        const currentStep = sortedSteps[currentIndex]
        const nextStep = sortedSteps[currentIndex + 1]

        if (currentStep && nextStep) {
          await stepService.updateStepOrder(currentStep.id, nextStep.order, authToken)
          await stepService.updateStepOrder(nextStep.id, currentStep.order, authToken)
          if (guideId) {
            const reloaded = await stepService.getStepsByGuideId(guideId, authToken)
            setSteps(reloaded)
          }
        }
      }
    } catch (err) {
      ErrorReporter.capture(err, { component: 'GuideFormScreen', action: 'handleMoveStepDown' })
      console.error('Failed to move step down:', err)
      Alert.alert('Error', 'Failed to reorder steps')
    }
  }

  const buildMetadata = (guideType: GuideType | null): Record<string, unknown> | undefined => {
    if (guideType === GUIDE_TYPES.COOKING && ingredients.length > 0) {
      return { ingredients }
    }
    if (guideType === GUIDE_TYPES.WORKOUT) {
      const meta: Record<string, unknown> = {}
      if (targetMuscles.length > 0) meta.target_muscles = targetMuscles
      if (equipment.length > 0) meta.equipment = equipment
      return Object.keys(meta).length > 0 ? meta : undefined
    }
    if (guideType === GUIDE_TYPES.GENERAL && notes.length > 0) {
      return { notes }
    }
    return undefined
  }

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
        const metadata = buildMetadata(selectedGuideType)
        const guide = await guideService.createGuide(
          selectedGuideType,
          title,
          description || undefined,
          authToken,
          undefined,
          isPublic,
          metadata,
          selectedLanguage
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

        // Update metadata per guide type
        const editMetadata = buildMetadata(selectedGuideType)
        if (editMetadata) {
          await guideService.updateGuideMetadata(
            guideId,
            editMetadata,
            authToken
          )
        }

        // Update language
        await guideService.updateGuideLanguage(guideId, selectedLanguage, authToken)

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
        <View style={formStyles.container}>
          <SkeletonLines count={1} lineHeight={28} lastLineWidth="50%" style={styles.skeletonTitleGap} />
          <SkeletonLines count={2} />
        </View>
      </SafeScreen>
    )
  }

  return (
    <SafeScreen testID="guide-form-screen">
      <ScrollView
        style={formStyles.scrollView}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
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

          <View style={formStyles.formGroup}>
            <Text style={formStyles.label}>Language</Text>
            <LanguageSelector
              selectedLanguage={selectedLanguage}
              onSelectLanguage={setSelectedLanguage}
              disabled={saving}
              testID="language-selector"
            />
          </View>

          {selectedGuideType === GUIDE_TYPES.COOKING && (
            <IngredientsEditor
              ingredients={ingredients}
              onChange={setIngredients}
              disabled={saving}
              testID="ingredients-editor"
            />
          )}

          {selectedGuideType === GUIDE_TYPES.WORKOUT && (
            <WorkoutEditor
              targetMuscles={targetMuscles}
              equipment={equipment}
              onChangeTargetMuscles={setTargetMuscles}
              onChangeEquipment={setEquipment}
              disabled={saving}
              testID="workout-editor"
            />
          )}

          {selectedGuideType === GUIDE_TYPES.GENERAL && (
            <NotesEditor
              notes={notes}
              onChange={setNotes}
              disabled={saving}
              testID="notes-editor"
            />
          )}

          {mode === 'edit' && guideId && (
            <View style={formStyles.formGroup} testID="steps-section">
              <View style={styles.stepsHeader}>
                <Text style={formStyles.label}>Steps</Text>
                {onAddStep && (
                  <TouchableOpacity
                    style={styles.addStepButton}
                    onPress={handleAddStep}
                    testID="add-step-button"
                  >
                    <Text style={styles.addStepButtonText}>+ Add Step</Text>
                  </TouchableOpacity>
                )}
              </View>

              <ContentLoader
                isLoading={loadingSteps}
                skeleton={<SkeletonList count={4} renderItem={index => <SkeletonCard key={index} />} />}
              >
                {steps.length > 0 ? (
                  <View>
                    {[...steps]
                      .sort((a, b) => a.order - b.order)
                      .map((step, index) => (
                        <StepListItem
                          key={step.id}
                          step={step}
                          stepNumber={index + 1}
                          isFirst={index === 0}
                          isLast={index === steps.length - 1}
                          onMoveUp={handleMoveStepUp}
                          onMoveDown={handleMoveStepDown}
                          onEdit={handleEditStep}
                          onDelete={handleDeleteStep}
                          canEdit={true}
                          testID={`step-${index}`}
                        />
                      ))}
                  </View>
                ) : (
                  <Text style={styles.emptyStepsText}>No steps yet.</Text>
                )}
              </ContentLoader>
            </View>
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

const styles = StyleSheet.create({
  skeletonTitleGap: {
    marginBottom: spacing.xl,
  },
  stepsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  addStepButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 6,
  },
  addStepButtonText: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.background,
  },
  emptyStepsText: {
    fontSize: typography.sizeMd,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
})
