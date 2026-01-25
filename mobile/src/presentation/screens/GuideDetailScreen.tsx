import React, { useMemo } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { colors, spacing, typography } from '../theme'
import { SafeScreen } from '../components/SafeScreen'
import { ComingSoon } from '../components/ComingSoon'
import { HomeScreenMockData } from '../../infrastructure/mocks/HomeScreenMockData'

interface GuideDetailScreenProps {
  guideId: string
  onBack: () => void
  testID?: string
}

export const GuideDetailScreen: React.FC<GuideDetailScreenProps> = ({
  guideId,
  onBack,
  testID,
}) => {
  const guide = useMemo(() => {
    const allGuides = HomeScreenMockData.getRecommendedGuides([], 1000)
    return allGuides.find(g => g.id === guideId)
  }, [guideId])

  if (!guide) {
    return (
      <SafeScreen>
        <View style={styles.container}>
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.errorText}>Guide not found</Text>
        </View>
      </SafeScreen>
    )
  }

  return (
    <SafeScreen>
      <ComingSoon testID={`${testID}:coming-soon`}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onBack} testID={`${testID}:back`}>
              <Text style={styles.backButton}>← Back</Text>
            </TouchableOpacity>
          </View>

          {/* Guide Content */}
          <View style={styles.content}>
            <Text style={styles.title}>{guide.title}</Text>
            <Text style={styles.category}>{guide.categoryName}</Text>
            <Text style={styles.description}>{guide.description}</Text>

            {/* Metadata */}
            <View style={styles.metadata}>
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Duration</Text>
                <Text style={styles.metadataValue}>
                  {guide.duration} min
                </Text>
              </View>
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Steps</Text>
                <Text style={styles.metadataValue}>
                  {guide.stepCount}
                </Text>
              </View>
            </View>

            {/* Full Description */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About This Guide</Text>
              <Text style={styles.sectionContent}>
                {guide.description}
              </Text>
            </View>

            {/* Steps Preview */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Steps</Text>
              <Text style={styles.sectionContent}>
                This guide contains {guide.stepCount} steps to help you complete your goal.
              </Text>
            </View>
          </View>
        </ScrollView>
      </ComingSoon>
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
  backButton: {
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
