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
import { StepService } from '../../domain/services/StepService'
import { StepRepository } from '../../infrastructure/repositories/StepRepository'
import { ServerConfigStorage } from '../../infrastructure/storage/ServerConfigStorage'
import { SafeScreen } from '../components/SafeScreen'
import { ErrorReporter } from '../../infrastructure/monitoring/ErrorReporter'
import { colors, spacing, commonStyles, typography } from '@guidr/shared/tokens'

interface StepFormScreenProps {
  mode: 'create' | 'edit'
  guideId: string
  stepId?: string
  order?: number
  onSave: (stepId: string) => void
  onCancel: () => void
  canEdit?: boolean
  isAdmin?: boolean
  // Optional dependencies (for testing/DI)
  stepService?: StepService
}

const MIN_DURATION = 1
const MAX_DURATION = 1440

export const StepFormScreen: React.FC<StepFormScreenProps> = ({
  mode,
  guideId,
  stepId,
  order = 0,
  onSave,
  onCancel,
  canEdit = true,
  stepService: injectedStepService,
}) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [durationStr, setDurationStr] = useState('')
  const [loading, setLoading] = useState(mode === 'edit')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [showAuthError, setShowAuthError] = useState(!canEdit)

  const authStorage = new AuthStorage()
  const serverConfigStorage = new ServerConfigStorage()

  // Initialize service (use injected or create new)
  const serviceRef = React.useRef<StepService | null>(null)

  const getService = (serverUrl: string) => {
    if (serviceRef.current) {
      return serviceRef.current
    }

    if (injectedStepService) {
      serviceRef.current = injectedStepService
      return serviceRef.current
    }

    const stepRepository = new StepRepository(serverUrl)
    serviceRef.current = new StepService(stepRepository)
    return serviceRef.current
  }

  useEffect(() => {
    if (!canEdit) {
      setShowAuthError(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (mode === 'edit' && stepId) {
      loadStep()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, stepId])

  const loadStep = async () => {
    try {
      setError(null)

      const authToken = await authStorage.getAuthToken()
      if (!authToken) throw new Error('No auth token found')

      const serverUrl = await serverConfigStorage.getServerUrl()
      if (!serverUrl) throw new Error('No server URL configured')

      const service = getService(serverUrl)

      // Load the specific step
      const step = await service.getStepById(stepId as string, authToken)
      if (!step) {
        throw new Error('Step not found')
      }

      setTitle(step.title)
      setDescription(step.description || '')
      setDurationStr(step.duration.toString())
    } catch (err) {
      ErrorReporter.capture(err, { component: 'StepFormScreen', action: 'loadStep' })
      console.error('Failed to load step:', err)
      setError(err instanceof Error ? err.message : 'Failed to load step')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = (): boolean => {
    if (!title || title.trim() === '') {
      setValidationError('Step title is required')
      return false
    }

    const duration = parseInt(durationStr, 10)
    if (!durationStr || isNaN(duration)) {
      setValidationError('Step duration is required')
      return false
    }

    if (duration < MIN_DURATION || duration > MAX_DURATION) {
      setValidationError(`Duration must be between ${MIN_DURATION} and ${MAX_DURATION} minutes`)
      return false
    }

    setValidationError(null)
    return true
  }

  const handleSave = async () => {
    if (!canEdit) {
      Alert.alert('Unauthorized', 'You do not have permission to edit this step')
      return
    }

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

      const service = getService(serverUrl)
      const duration = parseInt(durationStr, 10)

      if (mode === 'create') {
        const newStep = await service.createStep(
          guideId,
          order,
          title,
          duration,
          description || undefined,
          authToken
        )
        onSave(newStep.id)
      } else if (mode === 'edit' && stepId) {
        await service.updateStepTitle(stepId, title, authToken)
        await service.updateStepDuration(stepId, duration, authToken)
        if (description !== undefined) {
          await service.updateStepDescription(stepId, description, authToken)
        }
        onSave(stepId)
      }
    } catch (err) {
      ErrorReporter.capture(err, { component: 'StepFormScreen', action: 'handleSave' })
      console.error('Failed to save step:', err)
      setError(err instanceof Error ? err.message : 'Failed to save step')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = () => {
    if (mode !== 'edit' || !stepId) return

    if (!canEdit) {
      Alert.alert('Unauthorized', 'You do not have permission to delete this step')
      return
    }

    Alert.alert(
      'Delete Step',
      'Are you sure you want to delete this step? This action cannot be undone.',
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

              const service = getService(serverUrl)
              await service.deleteStep(stepId, authToken)

              onSave(stepId)
            } catch (err) {
              ErrorReporter.capture(err, { component: 'StepFormScreen', action: 'handleDelete' })
              console.error('Failed to delete step:', err)
              setError(err instanceof Error ? err.message : 'Failed to delete step')
              setSaving(false)
            }
          },
        },
      ]
    )
  }

  if (loading) {
    return (
      <SafeScreen testID="step-form-screen">
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeScreen>
    )
  }

  if (showAuthError) {
    return (
      <SafeScreen testID="step-form-screen">
        <View style={commonStyles.loadingContainer}>
          <Text style={[commonStyles.errorText, { textAlign: 'center', marginHorizontal: spacing.xl }]}>
            Only the guide owner or administrators can edit steps.
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
    <SafeScreen testID="step-form-screen">
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          {/* Header */}
          <Text style={commonStyles.titleLarge}>
            {mode === 'create' ? 'New Step' : 'Edit Step'}
          </Text>

          {error && <Text style={commonStyles.errorText}>{error}</Text>}

          {/* Title Input */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Step Title</Text>
            <TextInput
              style={[commonStyles.input, validationError && commonStyles.inputError]}
              placeholder="Enter step title"
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
              editable={!saving}
              testID="step-title-input"
            />
            {validationError && (
              <Text style={commonStyles.errorText}>{validationError}</Text>
            )}
          </View>

          {/* Duration Input */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Duration (minutes)</Text>
            <TextInput
              style={[commonStyles.input, validationError && commonStyles.inputError]}
              placeholder={`Enter duration (${MIN_DURATION}-${MAX_DURATION} minutes)`}
              placeholderTextColor={colors.textMuted}
              value={durationStr}
              onChangeText={setDurationStr}
              keyboardType="number-pad"
              editable={!saving}
              testID="step-duration-input"
            />
            <Text style={styles.helperText}>
              Valid range: {MIN_DURATION} - {MAX_DURATION} minutes
            </Text>
          </View>

          {/* Description Input */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[commonStyles.input, { minHeight: 100 }]}
              placeholder="Enter step description (optional)"
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
              editable={!saving}
              multiline
              testID="step-description-input"
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[commonStyles.button, saving && commonStyles.buttonDisabled]}
              onPress={handleSave}
              disabled={saving}
              testID="step-save-button"
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
              testID="step-cancel-button"
            >
              <Text style={commonStyles.buttonTextMuted}>Cancel</Text>
            </TouchableOpacity>

            {mode === 'edit' && (
              <TouchableOpacity
                style={[commonStyles.buttonDanger, styles.deleteButton]}
                onPress={handleDelete}
                disabled={saving}
                testID="step-delete-button"
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
  helperText: {
    fontSize: typography.sizeSm,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
  },
  buttonGroup: {
    marginTop: spacing.xxxl,
    gap: spacing.lg,
  },
  cancelButton: {
    marginTop: spacing.md,
  },
  deleteButton: {
    marginTop: spacing.lg,
  },
})
