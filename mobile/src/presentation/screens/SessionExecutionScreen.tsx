import React, { useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { AuthStorage } from '../../infrastructure/storage/AuthStorage'
import { ServerConfigStorage } from '../../infrastructure/storage/ServerConfigStorage'
import { SessionRepository } from '../../infrastructure/repositories/SessionRepository'
import { GuideRepository } from '../../infrastructure/repositories/GuideRepository'
import { StepRepository } from '../../infrastructure/repositories/StepRepository'
import { ErrorReporter } from '../../infrastructure/monitoring/ErrorReporter'
import { SafeScreen } from '../components/SafeScreen'
import { CountdownTimer } from '../components/CountdownTimer'
import { StepNavigationControls } from '../components/StepNavigationControls'
import { AutoAdvanceToggle } from '../components/AutoAdvanceToggle'
import { colors, spacing, typography, commonStyles } from '../theme'
import { Session } from '../../domain/entities/Session'
import { Guide } from '../../domain/entities/Guide'
import { Step } from '../../domain/entities/Step'

interface SessionExecutionScreenProps {
  sessionId: string
  onComplete: () => void
  onCancel: () => void
  onBack: () => void
}

export const SessionExecutionScreen: React.FC<SessionExecutionScreenProps> = ({
  sessionId,
  onComplete,
  onCancel,
  onBack,
}) => {
  // Domain entities
  const [session, setSession] = useState<Session | null>(null)
  const [guide, setGuide] = useState<Guide | null>(null)
  const [steps, setSteps] = useState<Step[]>([])

  // UI state
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [autoAdvance, setAutoAdvance] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Repositories - memoized to avoid dependency issues
  const authStorage = useMemo(() => new AuthStorage(), [])
  const serverConfigStorage = useMemo(() => new ServerConfigStorage(), [])
  const [sessionRepository, setSessionRepository] = useState<SessionRepository | null>(null)
  const [guideRepository, setGuideRepository] = useState<GuideRepository | null>(null)
  const [stepRepository, setStepRepository] = useState<StepRepository | null>(null)

  // Initialize repositories on mount
  useEffect(() => {
    const initializeRepositories = async () => {
      try {
        const serverUrl = await serverConfigStorage.getServerUrl()
        if (!serverUrl) {
          throw new Error('Server URL not configured')
        }
        setSessionRepository(new SessionRepository(serverUrl))
        setGuideRepository(new GuideRepository(serverUrl))
        setStepRepository(new StepRepository(serverUrl))
      } catch (err) {
        ErrorReporter.capture(err, { component: 'SessionExecutionScreen', action: 'initializeRepositories' })
        setError('Failed to initialize repositories')
      }
    }
    initializeRepositories()
  }, [serverConfigStorage])

  // Load session data on mount
  useEffect(() => {
    if (!sessionRepository || !guideRepository || !stepRepository) {
      return
    }

    const loadSessionData = async () => {
      try {
        setLoading(true)
        setError(null)

        const authToken = await authStorage.getAuthToken()
        if (!authToken) {
          throw new Error('No auth token found')
        }

        // Load session
        const loadedSession = await sessionRepository.findById(sessionId, authToken)
        if (!loadedSession) {
          throw new Error('Session not found')
        }
        setSession(loadedSession)

        // Load guide
        const loadedGuide = await guideRepository.findById(loadedSession.guideId, authToken)
        if (!loadedGuide) {
          throw new Error('Guide not found')
        }
        setGuide(loadedGuide)

        // Load steps
        const loadedSteps = await stepRepository.findByGuideId(loadedSession.guideId, authToken)
        // Sort by order field to ensure correct sequence
        const sortedSteps = loadedSteps.sort((a, b) => a.order - b.order)
        setSteps(sortedSteps)

        // Set current step index from session if available
        if (loadedSession.currentStepId) {
          const stepIndex = sortedSteps.findIndex((s) => s.id === loadedSession.currentStepId)
          if (stepIndex >= 0) {
            setCurrentStepIndex(stepIndex)
          }
        }
      } catch (err) {
        ErrorReporter.capture(err, { component: 'SessionExecutionScreen', action: 'loadSessionData' })
        console.error('Failed to load session data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load session')
      } finally {
        setLoading(false)
      }
    }

    loadSessionData()
  }, [sessionRepository, guideRepository, stepRepository, sessionId, authStorage])

  const currentStep = steps[currentStepIndex]
  const authToken = authStorage.getAuthToken()

  const handleStart = async () => {
    if (!session || !sessionRepository) return
    try {
      setError(null)
      const token = await authToken
      if (!token) throw new Error('No auth token')

      const updatedSession = await sessionRepository.start(sessionId, token)
      setSession(updatedSession)
      setIsTimerRunning(true)
    } catch (err) {
      ErrorReporter.capture(err, { component: 'SessionExecutionScreen', action: 'handleStart' })
      setError('Failed to start session')
    }
  }

  const handlePause = async () => {
    if (!session || !sessionRepository || !currentStep) return
    try {
      setError(null)
      setIsTimerRunning(false)

      const token = await authToken
      if (!token) throw new Error('No auth token')

      // Calculate elapsed seconds: duration - remaining
      // This will be updated by the timer's onSecondsChange callback
      // For now, we'll pass the current value from the session
      const updatedSession = await sessionRepository.pause(sessionId, session.stepElapsedSeconds, token)
      setSession(updatedSession)
    } catch (err) {
      ErrorReporter.capture(err, { component: 'SessionExecutionScreen', action: 'handlePause' })
      setError('Failed to pause session')
      setIsTimerRunning(true) // Resume timer if pause failed
    }
  }

  const handleResume = async () => {
    if (!session || !sessionRepository) return
    try {
      setError(null)
      const token = await authToken
      if (!token) throw new Error('No auth token')

      const updatedSession = await sessionRepository.resume(sessionId, token)
      setSession(updatedSession)
      setIsTimerRunning(true)
    } catch (err) {
      ErrorReporter.capture(err, { component: 'SessionExecutionScreen', action: 'handleResume' })
      setError('Failed to resume session')
    }
  }

  const handleComplete = async () => {
    if (!session || !sessionRepository) return
    try {
      setError(null)
      setIsTimerRunning(false)

      const token = await authToken
      if (!token) throw new Error('No auth token')

      await sessionRepository.complete(sessionId, token)
      onComplete()
    } catch (err) {
      ErrorReporter.capture(err, { component: 'SessionExecutionScreen', action: 'handleComplete' })
      setError('Failed to complete session')
    }
  }

  const handleCancel = () => {
    Alert.alert('Cancel Session', 'Are you sure you want to cancel this session? This cannot be undone.', [
      { text: 'Keep Session', onPress: () => {} },
      {
        text: 'Cancel Session',
        onPress: async () => {
          if (!session || !sessionRepository) return
          try {
            setError(null)
            setIsTimerRunning(false)

            const token = await authToken
            if (!token) throw new Error('No auth token')

            await sessionRepository.cancel(sessionId, token)
            onCancel()
          } catch (err) {
            ErrorReporter.capture(err, { component: 'SessionExecutionScreen', action: 'handleCancel' })
            setError('Failed to cancel session')
          }
        },
        style: 'destructive',
      },
    ])
  }

  const moveToStep = async (stepId: string) => {
    if (!session || !sessionRepository) return
    try {
      setError(null)
      setIsTimerRunning(false)

      const token = await authToken
      if (!token) throw new Error('No auth token')

      const updatedSession = await sessionRepository.moveToStep(sessionId, stepId, token)
      setSession(updatedSession)

      // Update current step index
      const newIndex = steps.findIndex((s) => s.id === stepId)
      if (newIndex >= 0) {
        setCurrentStepIndex(newIndex)
      }
    } catch (err) {
      ErrorReporter.capture(err, { component: 'SessionExecutionScreen', action: 'moveToStep' })
      setError('Failed to move to step')
    }
  }

  const handlePreviousStep = async () => {
    if (currentStepIndex > 0) {
      const previousStep = steps[currentStepIndex - 1]
      if (previousStep) {
        await moveToStep(previousStep.id)
      }
    }
  }

  const handleNextStep = async () => {
    if (currentStepIndex < steps.length - 1) {
      const nextStep = steps[currentStepIndex + 1]
      if (nextStep) {
        await moveToStep(nextStep.id)
      }
    }
  }

  const onTimerComplete = async () => {
    setIsTimerRunning(false)

    if (autoAdvance) {
      // Auto-advance to next step or complete if on last step
      if (currentStepIndex < steps.length - 1) {
        const nextStep = steps[currentStepIndex + 1]
        if (nextStep) {
          await moveToStep(nextStep.id)
          setIsTimerRunning(true)
        }
      } else {
        // On last step, complete the session
        await handleComplete()
      }
    }
    // If not auto-advance, just pause and let user manually advance
  }

  const handleSessionSecondsChange = async (remainingSeconds: number) => {
    if (!session || !currentStep) return

    // Calculate elapsed seconds
    const elapsedSeconds = currentStep.duration - remainingSeconds

    // Update session's elapsed seconds for the pause operation
    session.setStepElapsedSeconds(elapsedSeconds)
  }

  const handleAutoAdvanceChange = (value: boolean) => {
    setAutoAdvance(value)
  }

  const handleBackButton = async () => {
    // Pause session before navigating back
    if (isTimerRunning) {
      await handlePause()
    }
    onBack()
  }

  if (loading) {
    return (
      <SafeScreen>
        <View style={[commonStyles.container, styles.centerContent]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading session...</Text>
        </View>
      </SafeScreen>
    )
  }

  if (!session || !guide || !currentStep) {
    return (
      <SafeScreen>
        <View style={[commonStyles.container, styles.centerContent]}>
          <Text style={styles.errorTitle}>Session Not Found</Text>
          <Text style={styles.errorMessage}>Unable to load the requested session.</Text>
          <TouchableOpacity style={commonStyles.button} onPress={onBack}>
            <Text style={commonStyles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeScreen>
    )
  }

  return (
    <SafeScreen>
      <ScrollView style={commonStyles.container} contentContainerStyle={styles.scrollContent}>
        {/* Progress Indicator */}
        <View style={styles.progressSection}>
          <Text style={styles.guideTitle}>{guide.title}</Text>
          <Text style={styles.stepIndicator}>
            Step {currentStepIndex + 1} of {steps.length}
          </Text>
        </View>

        {/* Current Step */}
        <View style={styles.stepSection}>
          <Text style={styles.stepTitle}>{currentStep.title}</Text>
          {currentStep.description && <Text style={styles.stepDescription}>{currentStep.description}</Text>}
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.dismissError} onPress={() => setError(null)}>
              <Text style={styles.dismissErrorText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Timer */}
        <CountdownTimer
          durationSeconds={currentStep.duration}
          isRunning={isTimerRunning}
          onComplete={onTimerComplete}
          onSecondsChange={handleSessionSecondsChange}
          testID="session-timer"
        />

        {/* Session Control Buttons */}
        <View style={styles.controlsSection}>
          {!isTimerRunning && session.status === 'NotStarted' && (
            <TouchableOpacity style={commonStyles.button} onPress={handleStart}>
              <Text style={commonStyles.buttonText}>Start Session</Text>
            </TouchableOpacity>
          )}
          {isTimerRunning && (
            <TouchableOpacity style={[commonStyles.button, styles.pauseButton]} onPress={handlePause}>
              <Text style={commonStyles.buttonText}>Pause</Text>
            </TouchableOpacity>
          )}
          {!isTimerRunning && session.status === 'Paused' && (
            <TouchableOpacity style={commonStyles.button} onPress={handleResume}>
              <Text style={commonStyles.buttonText}>Resume</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Step Navigation */}
        <StepNavigationControls
          currentStepIndex={currentStepIndex}
          totalSteps={steps.length}
          onPrevious={handlePreviousStep}
          onNext={handleNextStep}
          disabled={isTimerRunning}
          testID="step-navigation"
        />

        {/* Complete/Cancel Buttons */}
        <View style={styles.actionButtonsSection}>
          {currentStepIndex === steps.length - 1 && !isTimerRunning && (
            <TouchableOpacity style={[commonStyles.button, styles.successButton]} onPress={handleComplete}>
              <Text style={commonStyles.buttonText}>Complete Session</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[commonStyles.button, styles.cancelButton]} onPress={handleCancel}>
            <Text style={commonStyles.buttonText}>Cancel Session</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[commonStyles.button, styles.backButton]} onPress={handleBackButton}>
            <Text style={commonStyles.buttonText}>Back</Text>
          </TouchableOpacity>
        </View>

        {/* Auto-Advance Toggle */}
        <AutoAdvanceToggle onValueChange={handleAutoAdvanceChange} testID="auto-advance-toggle" />
      </ScrollView>
    </SafeScreen>
  )
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressSection: {
    marginBottom: spacing.xl,
  },
  guideTitle: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  stepIndicator: {
    fontSize: typography.sizeSm,
    color: colors.textSecondary,
  },
  stepSection: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.lg,
  },
  stepTitle: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  stepDescription: {
    fontSize: typography.sizeSm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  errorContainer: {
    backgroundColor: colors.danger,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    fontSize: typography.sizeSm,
    color: colors.background,
    flex: 1,
  },
  dismissError: {
    padding: spacing.xs,
  },
  dismissErrorText: {
    fontSize: typography.sizeSm,
    color: colors.background,
    fontWeight: typography.weightSemibold,
  },
  controlsSection: {
    marginVertical: spacing.lg,
  },
  pauseButton: {
    backgroundColor: colors.warning,
  },
  actionButtonsSection: {
    gap: spacing.sm,
    marginVertical: spacing.lg,
  },
  successButton: {
    backgroundColor: colors.success,
  },
  cancelButton: {
    backgroundColor: colors.danger,
  },
  backButton: {
    backgroundColor: colors.textSecondary,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizeMd,
    color: colors.textPrimary,
  },
  errorTitle: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightBold,
    color: colors.danger,
    marginBottom: spacing.md,
  },
  errorMessage: {
    fontSize: typography.sizeMd,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
})
