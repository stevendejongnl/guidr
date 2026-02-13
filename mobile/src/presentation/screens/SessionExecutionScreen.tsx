import React, { useCallback, useEffect, useMemo, useState } from 'react'
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
import { SessionService } from '../../domain/services/SessionService'
import { GuideService } from '../../domain/services/GuideService'
import { StepService } from '../../domain/services/StepService'
import { ErrorReporter } from '../../infrastructure/monitoring/ErrorReporter'
import { SafeScreen } from '../components/SafeScreen'
import { CountdownTimer } from '../components/CountdownTimer'
import { StepNavigationControls } from '../components/StepNavigationControls'
import { AutoAdvanceToggle } from '../components/AutoAdvanceToggle'
import { SessionProgressIndicator } from '../components/SessionProgressIndicator'
import { colors, spacing, typography } from '@guidr/shared/tokens'
import { commonStyles } from '@guidr/shared/styles/react-native'
import { Session } from '../../domain/entities/Session'
import { Guide } from '../../domain/entities/Guide'
import { Step } from '../../domain/entities/Step'

interface SessionExecutionScreenProps {
  sessionId: string
  onComplete: () => void
  onCancel: () => void
  onBack: () => void
  // Optional dependency injection
  sessionService?: SessionService
  guideService?: GuideService
  stepService?: StepService
  authStorage?: AuthStorage
  serverConfigStorage?: ServerConfigStorage
}

export const SessionExecutionScreen: React.FC<SessionExecutionScreenProps> = ({
  sessionId,
  onComplete,
  onCancel,
  onBack,
  sessionService: injectedSessionService,
  guideService: injectedGuideService,
  stepService: injectedStepService,
  authStorage: injectedAuthStorage,
  serverConfigStorage: injectedServerConfigStorage,
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

  // Storage - memoized to avoid dependency issues, use injected or create new
  const authStorage = useMemo(() => injectedAuthStorage || new AuthStorage(), [injectedAuthStorage])
  const serverConfigStorage = useMemo(() => injectedServerConfigStorage || new ServerConfigStorage(), [injectedServerConfigStorage])

  // Services ref for caching
  const servicesRef = React.useRef<{
    sessionService: SessionService
    guideService: GuideService
    stepService: StepService
  } | null>(null)

  const getServices = useCallback((serverUrl: string) => {
    if (servicesRef.current) {
      return servicesRef.current
    }

    if (injectedSessionService && injectedGuideService && injectedStepService) {
      servicesRef.current = {
        sessionService: injectedSessionService,
        guideService: injectedGuideService,
        stepService: injectedStepService,
      }
      return servicesRef.current
    }

    const sessionRepository = new SessionRepository(serverUrl)
    const guideRepository = new GuideRepository(serverUrl)
    const stepRepository = new StepRepository(serverUrl)

    servicesRef.current = {
      sessionService: new SessionService(sessionRepository, guideRepository, stepRepository),
      guideService: new GuideService(guideRepository, stepRepository),
      stepService: new StepService(stepRepository),
    }
    return servicesRef.current
  }, [injectedSessionService, injectedGuideService, injectedStepService])

  // Load session data on mount
  useEffect(() => {
    const loadSessionData = async () => {
      try {
        setLoading(true)
        setError(null)

        const authToken = await authStorage.getAuthToken()
        if (!authToken) {
          throw new Error('No auth token found')
        }

        const serverUrl = await serverConfigStorage.getServerUrl()
        if (!serverUrl) {
          throw new Error('Server URL not configured')
        }

        const services = getServices(serverUrl)

        // Load session
        const loadedSession = await services.sessionService.getSessionById(sessionId, authToken)
        if (!loadedSession) {
          throw new Error('Session not found')
        }
        setSession(loadedSession)

        // Load guide
        const loadedGuide = await services.guideService.getGuideById(loadedSession.guideId, authToken)
        if (!loadedGuide) {
          throw new Error('Guide not found')
        }
        setGuide(loadedGuide)

        // Load steps
        const loadedSteps = await services.stepService.getStepsByGuideId(loadedSession.guideId, authToken)
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
  }, [sessionId, getServices, authStorage, serverConfigStorage])

  const currentStep = steps[currentStepIndex]
  const authToken = authStorage.getAuthToken()

  const handleStart = async () => {
    if (!session) return
    try {
      setError(null)
      const token = await authToken
      if (!token) throw new Error('No auth token')

      const serverUrl = await serverConfigStorage.getServerUrl()
      if (!serverUrl) throw new Error('Server URL not configured')

      const services = getServices(serverUrl)
      await services.sessionService.startSession(sessionId, token)
      setIsTimerRunning(true)
    } catch (err) {
      ErrorReporter.capture(err, { component: 'SessionExecutionScreen', action: 'handleStart' })
      setError('Failed to start session')
    }
  }

  const handlePause = async () => {
    if (!session || !currentStep) return
    try {
      setError(null)
      setIsTimerRunning(false)

      const token = await authToken
      if (!token) throw new Error('No auth token')

      const serverUrl = await serverConfigStorage.getServerUrl()
      if (!serverUrl) throw new Error('Server URL not configured')

      const services = getServices(serverUrl)
      // Calculate elapsed seconds: duration - remaining
      // This will be updated by the timer's onSecondsChange callback
      // For now, we'll pass the current value from the session
      await services.sessionService.pauseSession(sessionId, token)
    } catch (err) {
      ErrorReporter.capture(err, { component: 'SessionExecutionScreen', action: 'handlePause' })
      setError('Failed to pause session')
      setIsTimerRunning(true) // Resume timer if pause failed
    }
  }

  const handleResume = async () => {
    if (!session) return
    try {
      setError(null)
      const token = await authToken
      if (!token) throw new Error('No auth token')

      const serverUrl = await serverConfigStorage.getServerUrl()
      if (!serverUrl) throw new Error('Server URL not configured')

      const services = getServices(serverUrl)
      await services.sessionService.resumeSession(sessionId, token)
      setIsTimerRunning(true)
    } catch (err) {
      ErrorReporter.capture(err, { component: 'SessionExecutionScreen', action: 'handleResume' })
      setError('Failed to resume session')
    }
  }

  const handleComplete = async () => {
    if (!session) return
    try {
      setError(null)
      setIsTimerRunning(false)

      const token = await authToken
      if (!token) throw new Error('No auth token')

      const serverUrl = await serverConfigStorage.getServerUrl()
      if (!serverUrl) throw new Error('Server URL not configured')

      const services = getServices(serverUrl)
      await services.sessionService.completeSession(sessionId, token)
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
          if (!session) return
          try {
            setError(null)
            setIsTimerRunning(false)

            const token = await authToken
            if (!token) throw new Error('No auth token')

            const serverUrl = await serverConfigStorage.getServerUrl()
            if (!serverUrl) throw new Error('Server URL not configured')

            const services = getServices(serverUrl)
            await services.sessionService.cancelSession(sessionId, token)
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
    if (!session) return
    try {
      setError(null)
      setIsTimerRunning(false)

      const token = await authToken
      if (!token) throw new Error('No auth token')

      const serverUrl = await serverConfigStorage.getServerUrl()
      if (!serverUrl) throw new Error('Server URL not configured')

      const services = getServices(serverUrl)
      await services.sessionService.moveToStep(sessionId, stepId, token)

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

  const handleSessionSecondsChange = (remainingSeconds: number) => {
    if (!session || !currentStep) return

    // Calculate elapsed seconds
    const elapsedSeconds = currentStep.duration * 60 - remainingSeconds

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
        <SessionProgressIndicator
          currentStepIndex={currentStepIndex}
          totalSteps={steps.length}
          guideTitle={guide.title}
          testID="session-progress"
        />

        {/* Current Step */}
        <View
          style={styles.stepSection}
          accessible
          accessibilityRole="header"
          accessibilityLabel={`Current step: ${currentStep.title}`}
        >
          <Text
            style={styles.stepTitle}
            accessible
            accessibilityRole="header"
            accessibilityLabel={`Step title: ${currentStep.title}`}
          >
            {currentStep.title}
          </Text>
          {currentStep.description && (
            <Text
              style={styles.stepDescription}
              accessible
              accessibilityLabel={`Step description: ${currentStep.description}`}
            >
              {currentStep.description}
            </Text>
          )}
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
        {currentStep.duration > 0 && (
          <CountdownTimer
            durationSeconds={currentStep.duration * 60}
            isRunning={isTimerRunning}
            onComplete={onTimerComplete}
            onSecondsChange={handleSessionSecondsChange}
            testID="session-timer"
          />
        )}

        {/* Session Control Buttons */}
        <View style={styles.controlsSection}>
          {!isTimerRunning && session.status === 'NotStarted' && (
            <TouchableOpacity
              style={commonStyles.button}
              onPress={handleStart}
              accessibilityRole="button"
              accessibilityLabel="Start session timer"
              accessible
            >
              <Text style={commonStyles.buttonText}>Start Session</Text>
            </TouchableOpacity>
          )}
          {isTimerRunning && (
            <TouchableOpacity
              style={[commonStyles.button, styles.pauseButton]}
              onPress={handlePause}
              accessibilityRole="button"
              accessibilityLabel="Pause session timer"
              accessible
            >
              <Text style={commonStyles.buttonText}>Pause</Text>
            </TouchableOpacity>
          )}
          {!isTimerRunning && session.status === 'Paused' && (
            <TouchableOpacity
              style={commonStyles.button}
              onPress={handleResume}
              accessibilityRole="button"
              accessibilityLabel="Resume session timer"
              accessible
            >
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
            <TouchableOpacity
              style={[commonStyles.button, styles.successButton]}
              onPress={handleComplete}
              accessibilityRole="button"
              accessibilityLabel="Complete session"
              accessible
            >
              <Text style={commonStyles.buttonText}>Complete Session</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[commonStyles.button, styles.cancelButton]}
            onPress={handleCancel}
            accessibilityRole="button"
            accessibilityLabel="Cancel session, this action cannot be undone"
            accessible
          >
            <Text style={commonStyles.buttonText}>Cancel Session</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[commonStyles.button, styles.backButton]}
            onPress={handleBackButton}
            accessibilityRole="button"
            accessibilityLabel="Pause and go back to home"
            accessible
          >
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
