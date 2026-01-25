import React, { useEffect, useState } from 'react'
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
import { CategoryService } from '../../domain/services/CategoryService'
import { CategoryRepository } from '../../infrastructure/repositories/CategoryRepository'
import { ServerConfigStorage } from '../../infrastructure/storage/ServerConfigStorage'
import { Guide } from '../../domain/entities/Guide'
import { colors, spacing, typography, commonStyles } from '../theme'
import { SafeScreen } from '../components/SafeScreen'
import { ErrorReporter } from '../../infrastructure/monitoring/ErrorReporter'

interface GuideDetailScreenProps {
  guideId: string
  onBack: () => void
  onEdit?: (guideId: string) => void
  testID?: string
}

export const GuideDetailScreen: React.FC<GuideDetailScreenProps> = ({
  guideId,
  onBack,
  onEdit,
  testID,
}) => {
  const [guide, setGuide] = useState<Guide | null>(null)
  const [categoryName, setCategoryName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const authStorage = new AuthStorage()
  const serverConfigStorage = new ServerConfigStorage()

  useEffect(() => {
    loadGuideDetail()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guideId])

  const loadGuideDetail = async () => {
    try {
      setError(null)
      setLoading(true)

      const authToken = await authStorage.getAuthToken()
      if (!authToken) throw new Error('No auth token found')

      const serverUrl = await serverConfigStorage.getServerUrl()
      if (!serverUrl) throw new Error('No server URL configured')

      // Load guide
      const guideRepository = new GuideRepository(serverUrl)
      const stepRepository = new StepRepository(serverUrl)
      const guideService = new GuideService(guideRepository, stepRepository)
      const loadedGuide = await guideService.getGuideById(guideId, authToken)

      if (!loadedGuide) {
        throw new Error('Guide not found')
      }

      setGuide(loadedGuide)

      // Load category name
      const categoryRepository = new CategoryRepository(serverUrl)
      const categoryService = new CategoryService(categoryRepository)
      const category = await categoryService.getCategoryById(loadedGuide.categoryId, authToken)
      setCategoryName(category?.name || 'Unknown')
    } catch (err) {
      ErrorReporter.capture(err, { component: 'GuideDetailScreen', action: 'loadGuideDetail' })
      console.error('Failed to load guide detail:', err)
      setError(err instanceof Error ? err.message : 'Failed to load guide')
    } finally {
      setLoading(false)
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
          <Text style={styles.category}>{categoryName}</Text>
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

          {/* Steps Preview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Steps</Text>
            <Text style={styles.sectionContent}>
              This guide contains {guide.stepCount} {guide.stepCount === 1 ? 'step' : 'steps'} to help you complete your goal.
            </Text>
          </View>
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
  category: {
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
})
