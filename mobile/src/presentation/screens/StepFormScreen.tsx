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
import { InfoBanner } from '../components/InfoBanner'
import { ErrorReporter } from '../../infrastructure/monitoring/ErrorReporter'
import { colors, spacing, typography } from '@guidr/shared/tokens'
import { commonStyles, formStyles } from '@guidr/shared/styles/react-native'

interface StepFormScreenProps {
  mode: 'create' | 'edit'
  guideId: string
  stepId?: string
  order?: number
  onSave: (stepId: string) => void
  onCancel: () => void
  canEdit?: boolean
  isAdmin?: boolean
  isEditingOthersContent?: boolean
  // Optional dependencies (for testing/DI)
  stepService?: StepService
}

const MIN_DURATION = 0
const MAX_DURATION = 86400
const MAX_HOURS = 24
const MAX_MINUTES = 59

const decomposeDuration = (totalSeconds: number): { hours: number; minutes: number } => {
  const totalMinutes = Math.floor(totalSeconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return { hours, minutes }
}

const computeTotalSeconds = (hoursStr: string, minutesStr: string): number => {
  const hours = parseInt(hoursStr || '0', 10) || 0
  const minutes = parseInt(minutesStr || '0', 10) || 0
  return (hours * 60 + minutes) * 60
}

export const StepFormScreen: React.FC<StepFormScreenProps> = ({
  mode,
  guideId,
  stepId,
  order = 0,
  onSave,
  onCancel,
  canEdit = true,
  isAdmin = false,
  isEditingOthersContent = false,
  stepService: injectedStepService,
}) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [hoursStr, setHoursStr] = useState('')
  const [minutesStr, setMinutesStr] = useState('')
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
      const { hours, minutes } = decomposeDuration(step.duration)
      setHoursStr(hours > 0 ? hours.toString() : '')
      setMinutesStr(minutes > 0 ? minutes.toString() : '')
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

    const hours = parseInt(hoursStr || '0', 10)
    const minutes = parseInt(minutesStr || '0', 10)
    if (isNaN(hours) || isNaN(minutes)) {
      setValidationError('Duration must contain valid numbers')
      return false
    }

    if (hours < 0 || hours > MAX_HOURS || minutes < 0 || minutes > MAX_MINUTES) {
      setValidationError(`Hours must be 0-${MAX_HOURS}, minutes must be 0-${MAX_MINUTES}`)
      return false
    }

    if (hours === MAX_HOURS && minutes > 0) {
      setValidationError(`When hours is ${MAX_HOURS}, minutes must be 0`)
      return false
    }

    const duration = computeTotalSeconds(hoursStr, minutesStr)
    if (duration < MIN_DURATION || duration > MAX_DURATION) {
      setValidationError(`Duration must be between 0 and ${MAX_DURATION / 60} minutes`)
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
      const duration = computeTotalSeconds(hoursStr, minutesStr)

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
      <ScrollView style={formStyles.scrollView}>
        <View style={formStyles.container}>
          <InfoBanner
            message="You are editing content created by another user"
            visible={mode === 'edit' && isAdmin && isEditingOthersContent}
            testID="editing-others-content-banner"
          />

          {/* Header */}
          <Text style={commonStyles.titleLarge}>
            {mode === 'create' ? 'New Step' : 'Edit Step'}
          </Text>

          {error && <Text style={commonStyles.errorText}>{error}</Text>}

          {/* Title Input */}
          <View style={formStyles.formGroup}>
            <Text style={formStyles.label}>Step Title</Text>
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
          <View style={formStyles.formGroup}>
            <Text style={formStyles.label}>Duration</Text>
            <View style={styles.durationRow}>
              <View style={styles.durationField}>
                <TextInput
                  style={[commonStyles.input, validationError && commonStyles.inputError]}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  value={hoursStr}
                  onChangeText={setHoursStr}
                  keyboardType="number-pad"
                  maxLength={2}
                  editable={!saving}
                  testID="step-duration-hours-input"
                />
                <Text style={styles.durationUnit}>hours</Text>
              </View>
              <View style={styles.durationField}>
                <TextInput
                  style={[commonStyles.input, validationError && commonStyles.inputError]}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  value={minutesStr}
                  onChangeText={setMinutesStr}
                  keyboardType="number-pad"
                  maxLength={2}
                  editable={!saving}
                  testID="step-duration-minutes-input"
                />
                <Text style={styles.durationUnit}>minutes</Text>
              </View>
            </View>
            <Text style={styles.helperText}>
              Leave empty for no timer. Maximum {MAX_DURATION / 60} minutes (24 hours)
            </Text>
          </View>

          {/* Description Input */}
          <View style={formStyles.formGroup}>
            <Text style={formStyles.label}>Description</Text>
            <TextInput
              style={[commonStyles.input, formStyles.descriptionInput]}
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
          <View style={formStyles.buttonGroup}>
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
              style={[commonStyles.buttonSecondary, formStyles.cancelButton]}
              onPress={onCancel}
              disabled={saving}
              testID="step-cancel-button"
            >
              <Text style={commonStyles.buttonTextMuted}>Cancel</Text>
            </TouchableOpacity>

            {mode === 'edit' && (
              <TouchableOpacity
                style={[commonStyles.buttonDanger, formStyles.deleteButton]}
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
  helperText: {
    fontSize: typography.sizeSm,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
  },
  durationRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  durationField: {
    flex: 1,
  },
  durationUnit: {
    fontSize: typography.sizeSm,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
  },
})
