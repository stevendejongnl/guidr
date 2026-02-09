import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { AuthStorage } from '../../infrastructure/storage/AuthStorage'
import { GuideService } from '../../domain/services/GuideService'
import { GuideRepository } from '../../infrastructure/repositories/GuideRepository'
import { StepRepository } from '../../infrastructure/repositories/StepRepository'
import { StepService } from '../../domain/services/StepService'
import { GUIDE_TYPE_LABELS, type GuideType } from '../../domain/constants/GuideTypes'
import { ServerConfigStorage } from '../../infrastructure/storage/ServerConfigStorage'
import { Guide } from '../../domain/entities/Guide'
import { Step } from '../../domain/entities/Step'
import { colors, spacing, typography } from '@guidr/shared/tokens'
import { commonStyles } from '@guidr/shared/styles/react-native'
import { SafeScreen } from '../components/SafeScreen'
import { StepListItem } from '../components/StepListItem'
import { ErrorReporter } from '../../infrastructure/monitoring/ErrorReporter'

interface GuideDetailScreenProps {
  guideId: string
  onBack: () => void
  onEdit?: (guideId: string) => void
  onAddStep?: (guideId: string, stepCount: number) => void
  onEditStep?: (stepId: string) => void
  isAdmin?: boolean
  stepService?: StepService
  guideService?: GuideService
  authStorage?: AuthStorage
  serverConfigStorage?: ServerConfigStorage
  testID?: string
}

export const GuideDetailScreen: React.FC<GuideDetailScreenProps> = ({
  guideId,
  onBack,
  onEdit,
  onAddStep,
  onEditStep,
  isAdmin = false,
  stepService: injectedStepService,
  guideService: injectedGuideService,
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
  const [canEditSteps, setCanEditSteps] = useState(false)

  const authStorage = injectedAuthStorage || new AuthStorage()
  const serverConfigStorage = injectedServerConfigStorage || new ServerConfigStorage()

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

      const authToken = await authStorage.getAuthToken()
      if (!authToken) throw new Error('No auth token found')

      const serverUrl = await serverConfigStorage.getServerUrl()
      if (!serverUrl) throw new Error('No server URL configured')

      // Load current user ID
      const userId = await authStorage.getUserId()

      // Get services (injected or create)
      const services = getServices(serverUrl)

      // Load guide
      const loadedGuide = await services.guideService.getGuideById(guideId, authToken)

      if (!loadedGuide) {
        throw new Error('Guide not found')
      }

      setGuide(loadedGuide)

      // Calculate edit permission: admin OR owner
      const canEdit = Boolean(isAdmin || (userId && loadedGuide.isOwnedBy(userId)))
      setCanEditSteps(canEdit)

      // Derive guide type label
      const label = GUIDE_TYPE_LABELS[loadedGuide.guideType as GuideType] || loadedGuide.guideType
      setGuideTypeLabel(label)

      // Load steps if service is available
      if (injectedStepService || servicesRef.current) {
        await loadSteps(authToken, serverUrl)
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

  const handleAddStep = () => {
    const nextOrder = steps.length
    if (onAddStep) {
      onAddStep(guideId, nextOrder)
    }
  }

  const handleEditStep = (stepId: string) => {
    if (onEditStep) {
      onEditStep(stepId)
    }
  }

  const handleDeleteStep = (stepId: string) => {
    if (!canEditSteps) {
      Alert.alert('Unauthorized', 'Only the guide owner or admins can edit steps')
      return
    }

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
              const authToken = await authStorage.getAuthToken()
              if (!authToken) throw new Error('No auth token found')

              const serverUrl = await serverConfigStorage.getServerUrl()
              if (!serverUrl) throw new Error('No server URL configured')

              const stepService = getStepService(serverUrl)
              await stepService.deleteStep(stepId, authToken)

              // Reload steps after deletion
              await loadSteps(authToken, serverUrl)
            } catch (err) {
              ErrorReporter.capture(err, { component: 'GuideDetailScreen', action: 'handleDeleteStep' })
              console.error('Failed to delete step:', err)
              Alert.alert('Error', 'Failed to delete step')
            }
          },
        },
      ]
    )
  }

  const handleMoveStepUp = async (stepId: string) => {
    if (!canEditSteps) {
      Alert.alert('Unauthorized', 'Only the guide owner or admins can edit steps')
      return
    }

    try {
      const authToken = await authStorage.getAuthToken()
      if (!authToken) throw new Error('No auth token found')

      const serverUrl = await serverConfigStorage.getServerUrl()
      if (!serverUrl) throw new Error('No server URL configured')

      const stepService = getStepService(serverUrl)

      // Find the step and its predecessor
      const sortedSteps = [...steps].sort((a, b) => a.order - b.order)
      const currentIndex = sortedSteps.findIndex((s) => s.id === stepId)

      if (currentIndex > 0) {
        const currentStep = sortedSteps[currentIndex]
        const previousStep = sortedSteps[currentIndex - 1]

        if (currentStep && previousStep) {
          // Swap orders
          await stepService.updateStepOrder(currentStep.id, previousStep.order, authToken)
          await stepService.updateStepOrder(previousStep.id, currentStep.order, authToken)

          // Reload steps
          await loadSteps(authToken, serverUrl)
        }
      }
    } catch (err) {
      ErrorReporter.capture(err, { component: 'GuideDetailScreen', action: 'handleMoveStepUp' })
      console.error('Failed to move step up:', err)
      Alert.alert('Error', 'Failed to reorder steps')
    }
  }

  const handleMoveStepDown = async (stepId: string) => {
    if (!canEditSteps) {
      Alert.alert('Unauthorized', 'Only the guide owner or admins can edit steps')
      return
    }

    try {
      const authToken = await authStorage.getAuthToken()
      if (!authToken) throw new Error('No auth token found')

      const serverUrl = await serverConfigStorage.getServerUrl()
      if (!serverUrl) throw new Error('No server URL configured')

      const stepService = getStepService(serverUrl)

      // Find the step and its successor
      const sortedSteps = [...steps].sort((a, b) => a.order - b.order)
      const currentIndex = sortedSteps.findIndex((s) => s.id === stepId)

      if (currentIndex < sortedSteps.length - 1) {
        const currentStep = sortedSteps[currentIndex]
        const nextStep = sortedSteps[currentIndex + 1]

        if (currentStep && nextStep) {
          // Swap orders
          await stepService.updateStepOrder(currentStep.id, nextStep.order, authToken)
          await stepService.updateStepOrder(nextStep.id, currentStep.order, authToken)

          // Reload steps
          await loadSteps(authToken, serverUrl)
        }
      }
    } catch (err) {
      ErrorReporter.capture(err, { component: 'GuideDetailScreen', action: 'handleMoveStepDown' })
      console.error('Failed to move step down:', err)
      Alert.alert('Error', 'Failed to reorder steps')
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

          {/* Steps Section */}
          {(injectedStepService || servicesRef.current) && (
            <View style={styles.section}>
              <View style={styles.stepsHeader}>
                <Text style={styles.sectionTitle}>Steps</Text>
                {onAddStep && canEditSteps && (
                  <TouchableOpacity
                    style={styles.addStepButton}
                    onPress={handleAddStep}
                    testID={`${testID}:add-step`}
                  >
                    <Text style={styles.addStepButtonText}>+ Add</Text>
                  </TouchableOpacity>
                )}
              </View>

              {loadingSteps ? (
                <View style={commonStyles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : steps.length > 0 ? (
                <View>
                  {steps
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
                        canEdit={canEditSteps}
                        testID={`${testID}:step-${index}`}
                      />
                    ))}
                </View>
              ) : (
                <Text style={styles.emptyStateText}>No steps yet. Add your first step!</Text>
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
  emptyStateText: {
    fontSize: typography.sizeMd,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
})
