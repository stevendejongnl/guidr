import React, { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { AuthStorage } from '../../infrastructure/storage/AuthStorage'
import { GuideService } from '../../domain/services/GuideService'
import { GuideRepository } from '../../infrastructure/repositories/GuideRepository'
import { StepRepository } from '../../infrastructure/repositories/StepRepository'
import { StepService } from '../../domain/services/StepService'
import { StepTimerClient } from '../../infrastructure/api/StepTimerClient'
import { GUIDE_TYPES, GUIDE_TYPE_LABELS, type GuideType } from '../../domain/constants/GuideTypes'
import { ServerConfigStorage } from '../../infrastructure/storage/ServerConfigStorage'
import { Guide } from '../../domain/entities/Guide'
import { Step } from '../../domain/entities/Step'
import { colors, spacing, typography } from '@guidr/shared/tokens'
import { commonStyles } from '@guidr/shared/styles/react-native'
import { SafeScreen } from '../components/SafeScreen'
import { StepListItem } from '../components/StepListItem'
import { InfoBanner } from '../components/InfoBanner'
import { ErrorReporter } from '../../infrastructure/monitoring/ErrorReporter'
import { useStepTimers } from '../hooks/useStepTimers'
import { useLiveActivity } from '../hooks/useLiveActivity'
import { LiveActivityService } from '../../infrastructure/native/LiveActivityService'
import { NotificationService } from '../../infrastructure/native/NotificationService'
import { NotificationPreferencesStorage } from '../../infrastructure/storage/NotificationPreferencesStorage'

interface GuideDetailScreenProps {
  guideId: string
  onBack: () => void
  onEdit?: (guideId: string) => void
  isAdmin?: boolean
  stepService?: StepService
  guideService?: GuideService
  stepTimerClient?: StepTimerClient
  liveActivityService?: LiveActivityService
  notificationService?: NotificationService
  notificationPreferencesStorage?: NotificationPreferencesStorage
  authStorage?: AuthStorage
  serverConfigStorage?: ServerConfigStorage
  testID?: string
}

export const GuideDetailScreen: React.FC<GuideDetailScreenProps> = ({
  guideId,
  onBack,
  onEdit,
  isAdmin = false,
  stepService: injectedStepService,
  guideService: injectedGuideService,
  stepTimerClient: injectedStepTimerClient,
  liveActivityService: injectedLiveActivityService,
  notificationService: injectedNotificationService,
  notificationPreferencesStorage: injectedNotifPrefsStorage,
  authStorage: injectedAuthStorage,
  serverConfigStorage: injectedServerConfigStorage,
  testID,
}) => {
  const [guide, setGuide] = useState<Guide | null>(null)
  const [guideTypeLabel, setGuideTypeLabel] = useState<string>('')
  const [steps, setSteps] = useState<Step[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingSteps, setLoadingSteps] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isViewingOthersGuide, setIsViewingOthersGuide] = useState(false)
  const [authToken, setAuthToken] = useState<string | null>(null)

  const authStorage = injectedAuthStorage || new AuthStorage()
  const serverConfigStorage = injectedServerConfigStorage || new ServerConfigStorage()
  const notificationService = injectedNotificationService || new NotificationService()
  const notifPrefsStorage = injectedNotifPrefsStorage || new NotificationPreferencesStorage()

  // Step timer client ref
  const timerClientRef = React.useRef<StepTimerClient | null>(
    injectedStepTimerClient || null,
  )
  const [timerClient, setTimerClient] = useState<StepTimerClient | null>(
    injectedStepTimerClient || null,
  )

  // Step timers hook
  const stepTimers = useStepTimers(guideId, authToken, timerClient)

  // Live Activity hook
  const liveActivity = useLiveActivity(injectedLiveActivityService)
  const prevCompletedRef = useRef<Set<string>>(new Set())

  // Detect timer completion: update Live Activity + fire Android notification
  useEffect(() => {
    const prevCompleted = prevCompletedRef.current
    for (const [stepId, display] of Object.entries(stepTimers.timers)) {
      if (display.isComplete && !prevCompleted.has(stepId)) {
        liveActivity.updateTimer(stepId, 0, false, true)
        // Fire Android notification on completion (iOS handled natively)
        const step = steps.find(s => s.id === stepId)
        if (step && guide) {
          notifPrefsStorage.getTimerNotificationsEnabled().then(enabled => {
            if (!enabled) return
            notifPrefsStorage.getCriticalNotificationsEnabled().then(critical => {
              notificationService.showImmediateNotification(
                stepId,
                step.title,
                guide.title,
                critical,
              )
            })
          })
        }
      }
    }
    prevCompletedRef.current = new Set(
      Object.entries(stepTimers.timers)
        .filter(([, d]) => d.isComplete)
        .map(([id]) => id),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepTimers.timers, liveActivity])

  // Initialize service refs (use injected or create new)
  const servicesRef = React.useRef<{
    guideService: GuideService
    stepService: StepService
  } | null>(null)

  const getServices = (serverUrl: string) => {
    if (servicesRef.current) {
      return servicesRef.current
    }

    if (injectedGuideService && injectedStepService) {
      servicesRef.current = {
        guideService: injectedGuideService,
        stepService: injectedStepService,
      }
      return servicesRef.current
    }

    const guideRepository = new GuideRepository(serverUrl)
    const stepRepository = new StepRepository(serverUrl)

    servicesRef.current = {
      guideService: new GuideService(guideRepository, stepRepository),
      stepService: new StepService(stepRepository),
    }
    return servicesRef.current
  }

  const getStepService = (serverUrl: string) => {
    const services = getServices(serverUrl)
    return services.stepService
  }

  useEffect(() => {
    loadGuideDetail()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guideId, injectedGuideService, injectedStepService])

  const loadGuideDetail = async () => {
    try {
      setError(null)
      setLoading(true)

      const token = await authStorage.getAuthToken()
      if (!token) throw new Error('No auth token found')
      setAuthToken(token)

      const serverUrl = await serverConfigStorage.getServerUrl()
      if (!serverUrl) throw new Error('No server URL configured')

      // Initialize timer client if not injected
      if (!timerClientRef.current) {
        const newClient = new StepTimerClient(serverUrl)
        timerClientRef.current = newClient
        setTimerClient(newClient)
      }

      // Load current user ID
      const userId = await authStorage.getUserId()

      // Get services (injected or create)
      const services = getServices(serverUrl)

      // Load guide
      const loadedGuide = await services.guideService.getGuideById(guideId, token)

      if (!loadedGuide) {
        throw new Error('Guide not found')
      }

      setGuide(loadedGuide)

      // Detect when admin is viewing another user's guide
      setIsViewingOthersGuide(isAdmin && !!userId && !loadedGuide.isOwnedBy(userId))

      // Derive guide type label
      const label = GUIDE_TYPE_LABELS[loadedGuide.guideType as GuideType] || loadedGuide.guideType
      setGuideTypeLabel(label)

      // Load steps if service is available
      if (injectedStepService || servicesRef.current) {
        await loadSteps(token, serverUrl)
      }
    } catch (err) {
      ErrorReporter.capture(err, { component: 'GuideDetailScreen', action: 'loadGuideDetail' })
      console.error('Failed to load guide detail:', err)
      setError(err instanceof Error ? err.message : 'Failed to load guide')
    } finally {
      setLoading(false)
    }
  }

  const loadSteps = async (authToken: string, serverUrl: string) => {
    try {
      setLoadingSteps(true)
      const stepService = getStepService(serverUrl)
      const loadedSteps = await stepService.getStepsByGuideId(guideId, authToken)
      setSteps(loadedSteps)
    } catch (err) {
      ErrorReporter.capture(err, { component: 'GuideDetailScreen', action: 'loadSteps' })
      console.error('Failed to load steps:', err)
    } finally {
      setLoadingSteps(false)
    }
  }

  if (loading) {
    return (
      <SafeScreen {...(testID && { testID })}>
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeScreen>
    )
  }

  if (!guide || error) {
    return (
      <SafeScreen {...(testID && { testID })}>
        <View style={styles.container}>
          <TouchableOpacity onPress={onBack} testID={`${testID}:back`}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.errorText}>{error || 'Guide not found'}</Text>
        </View>
      </SafeScreen>
    )
  }

  const ingredients: Array<{ name: string; quantity: string; unit: string }> =
    guide.guideType === GUIDE_TYPES.COOKING &&
    guide.metadata?.ingredients &&
    Array.isArray(guide.metadata.ingredients)
      ? (guide.metadata.ingredients as Array<{ name: string; quantity: string; unit: string }>)
      : []

  const targetMuscles: Array<{ name: string; focus: string }> =
    guide.guideType === GUIDE_TYPES.WORKOUT &&
    guide.metadata?.target_muscles &&
    Array.isArray(guide.metadata.target_muscles)
      ? (guide.metadata.target_muscles as Array<{ name: string; focus: string }>)
      : []

  const equipmentItems: Array<{ name: string; weight: string }> =
    guide.guideType === GUIDE_TYPES.WORKOUT &&
    guide.metadata?.equipment &&
    Array.isArray(guide.metadata.equipment)
      ? (guide.metadata.equipment as Array<{ name: string; weight: string }>)
      : []

  const notes: Array<{ key: string; value: string }> =
    guide.guideType === GUIDE_TYPES.GENERAL &&
    guide.metadata?.notes &&
    Array.isArray(guide.metadata.notes)
      ? (guide.metadata.notes as Array<{ key: string; value: string }>)
      : []

  return (
    <SafeScreen {...(testID && { testID })}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={onBack} testID={`${testID}:back`}>
              <Text style={styles.backButton}>← Back</Text>
            </TouchableOpacity>
            {onEdit && (
              <TouchableOpacity onPress={() => onEdit(guideId)}>
                <Text style={styles.editButton}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Admin banner for viewing other's guide */}
        <InfoBanner
          message="You are viewing a guide from another user"
          visible={isViewingOthersGuide}
          testID={`${testID}:info-banner`}
        />

        {/* Guide Content */}
        <View style={styles.content}>
          <Text style={styles.title}>{guide.title}</Text>
          <Text style={styles.guideType}>{guideTypeLabel}</Text>
          {guide.description && (
            <Text style={styles.description}>{guide.description}</Text>
          )}

          {/* Metadata */}
          <View style={styles.metadata}>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>Steps</Text>
              <Text style={styles.metadataValue}>{guide.stepCount}</Text>
            </View>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>Created</Text>
              <Text style={styles.metadataValue}>
                {new Date(guide.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {/* Full Description */}
          {guide.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About This Guide</Text>
              <Text style={styles.sectionContent}>{guide.description}</Text>
            </View>
          )}

          {/* Ingredients Section (cooking guides only) */}
          {ingredients.length > 0 && (
            <View style={styles.section} testID={`${testID}:ingredients`}>
              <Text style={styles.sectionTitle}>Ingredients</Text>
              {ingredients.map((ingredient, index) => (
                <View key={index} style={styles.ingredientItem}>
                  <Text style={styles.ingredientText}>
                    {ingredient.quantity} {ingredient.unit} — {ingredient.name}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Target Muscles Section (workout guides only) */}
          {targetMuscles.length > 0 && (
            <View style={styles.section} testID={`${testID}:target-muscles`}>
              <Text style={styles.sectionTitle}>Target Muscles</Text>
              {targetMuscles.map((muscle, index) => (
                <View key={index} style={styles.ingredientItem}>
                  <Text style={styles.ingredientText}>
                    {muscle.name} ({muscle.focus})
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Equipment Section (workout guides only) */}
          {equipmentItems.length > 0 && (
            <View style={styles.section} testID={`${testID}:equipment`}>
              <Text style={styles.sectionTitle}>Equipment</Text>
              {equipmentItems.map((item, index) => (
                <View key={index} style={styles.ingredientItem}>
                  <Text style={styles.ingredientText}>
                    {item.name} — {item.weight}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Notes Section (general guides only) */}
          {notes.length > 0 && (
            <View style={styles.section} testID={`${testID}:notes`}>
              <Text style={styles.sectionTitle}>Notes</Text>
              {notes.map((note, index) => (
                <View key={index} style={styles.ingredientItem}>
                  <Text style={styles.ingredientText}>
                    {note.key}: {note.value}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Steps Section */}
          {(injectedStepService || servicesRef.current) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Steps</Text>

              {loadingSteps ? (
                <View style={commonStyles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : steps.length > 0 ? (
                <View>
                  {steps
                    .sort((a, b) => a.order - b.order)
                    .map((step, index) => {
                      const timerDisplay = stepTimers.timers[step.id]
                      const mode = step.duration > 0 ? 'countdown' : 'stopwatch'
                      const initialSeconds = step.duration > 0 ? step.duration * 60 : 0
                      return (
                        <StepListItem
                          key={step.id}
                          step={step}
                          stepNumber={index + 1}
                          isFirst={index === 0}
                          isLast={index === steps.length - 1}
                          onMoveUp={() => {}}
                          onMoveDown={() => {}}
                          onEdit={() => {}}
                          onDelete={() => {}}
                          canEdit={false}
                          timer={{
                            displaySeconds: timerDisplay?.displaySeconds ?? initialSeconds,
                            isRunning: timerDisplay?.isRunning ?? false,
                            isPaused: timerDisplay?.isPaused ?? false,
                            isComplete: timerDisplay?.isComplete ?? false,
                            mode,
                            onStart: async () => {
                              notificationService.requestPermission()
                              const remaining = timerDisplay?.isPaused
                                ? timerDisplay.displaySeconds
                                : initialSeconds
                              await stepTimers.startTimer(step.id, step.duration)
                              await liveActivity.addTimer({
                                stepId: step.id,
                                guideTitle: guide.title,
                                stepTitle: step.title,
                                totalDurationSeconds: initialSeconds,
                                remainingSeconds: remaining,
                              })
                            },
                            onPause: async () => {
                              await stepTimers.pauseTimer(step.id)
                              const display = stepTimers.timers[step.id]
                              liveActivity.updateTimer(
                                step.id,
                                display?.displaySeconds ?? 0,
                                true,
                                false,
                              )
                            },
                            onReset: async () => {
                              await stepTimers.resetTimer(step.id)
                              liveActivity.removeTimer(step.id)
                              notificationService.cancelTimerNotification(step.id)
                            },
                          }}
                          testID={`${testID}:step-${index}`}
                        />
                      )
                    })}
                </View>
              ) : (
                <Text style={styles.emptyStateText}>No steps yet.</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeScreen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    fontSize: typography.sizeMd,
    color: colors.primary,
    fontWeight: typography.weightSemibold,
  },
  editButton: {
    fontSize: typography.sizeMd,
    color: colors.primary,
    fontWeight: typography.weightSemibold,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  title: {
    fontSize: typography.sizeXxxl,
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  guideType: {
    fontSize: typography.sizeSm,
    color: colors.primary,
    fontWeight: typography.weightSemibold,
    marginBottom: spacing.md,
  },
  description: {
    fontSize: typography.sizeMd,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  metadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  metadataItem: {
    alignItems: 'center',
  },
  metadataLabel: {
    fontSize: typography.sizeSm,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  metadataValue: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightSemibold,
    color: colors.textPrimary,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightSemibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  sectionContent: {
    fontSize: typography.sizeMd,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  errorText: {
    fontSize: typography.sizeMd,
    color: colors.danger,
    marginTop: spacing.lg,
  },
  emptyStateText: {
    fontSize: typography.sizeMd,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  ingredientText: {
    fontSize: typography.sizeMd,
    color: colors.textSecondary,
    lineHeight: 24,
  },
})
