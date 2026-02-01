import React, { useState, useMemo, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import { colors, spacing, typography, commonStyles } from '@guidr/shared/tokens'
import { SearchBar } from '../components/SearchBar'
import { CategoryChip } from '../components/CategoryChip'
import { GuideCard } from '../components/GuideCard'
import { EmptyState } from '../components/EmptyState'
import { NodeProgressIndicator } from '../components/NodeProgressIndicator'
import { GuideViewModel, createGuideViewModel } from '../viewmodels/GuideViewModel'
import { AuthStorage } from '../../infrastructure/storage/AuthStorage'
import { ServerConfigStorage } from '../../infrastructure/storage/ServerConfigStorage'
import { GuideService } from '../../domain/services/GuideService'
import { CategoryService } from '../../domain/services/CategoryService'
import { GuideRepository } from '../../infrastructure/repositories/GuideRepository'
import { StepRepository } from '../../infrastructure/repositories/StepRepository'
import { CategoryRepository } from '../../infrastructure/repositories/CategoryRepository'
import { ErrorReporter } from '../../infrastructure/monitoring/ErrorReporter'

interface BrowseGuidesScreenProps {
  onBack: () => void
  onViewGuide: (guideId: string) => void
  testID?: string
  // Optional dependencies (for testing/DI)
  guideService?: GuideService
  categoryService?: CategoryService
}

export const BrowseGuidesScreen: React.FC<BrowseGuidesScreenProps> = ({
  onBack,
  onViewGuide,
  testID,
  guideService: injectedGuideService,
  categoryService: injectedCategoryService,
}) => {
  const [searchText, setSearchText] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All Guides')
  const [guides, setGuides] = useState<GuideViewModel[]>([])
  const [categories, setCategories] = useState<string[]>(['All Guides'])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const authStorage = new AuthStorage()
  const serverConfigStorage = new ServerConfigStorage()

  // Initialize services (use injected or create new)
  const servicesRef = React.useRef<{
    guideService: GuideService
    categoryService: CategoryService
  } | null>(null)

  const getServices = (serverUrl: string) => {
    if (servicesRef.current) {
      return servicesRef.current
    }

    if (injectedGuideService && injectedCategoryService) {
      servicesRef.current = {
        guideService: injectedGuideService,
        categoryService: injectedCategoryService,
      }
      return servicesRef.current
    }

    const guideRepository = new GuideRepository(serverUrl)
    const stepRepository = new StepRepository(serverUrl)
    const categoryRepository = new CategoryRepository(serverUrl)

    servicesRef.current = {
      guideService: new GuideService(guideRepository, stepRepository),
      categoryService: new CategoryService(categoryRepository),
    }
    return servicesRef.current
  }

  const loadData = async () => {
    try {
      setError(null)
      setIsLoading(true)

      // Get auth token for API calls
      const authToken = await authStorage.getAuthToken()
      if (!authToken) {
        throw new Error('No auth token found')
      }

      // Fetch server URL
      const serverUrl = await serverConfigStorage.getServerUrl()
      if (!serverUrl) {
        throw new Error('No server URL configured')
      }

      // Get services
      const services = getServices(serverUrl)

      // Load guides and categories in parallel
      const [allGuides, allCategories] = await Promise.all([
        services.guideService.getAllGuides(authToken),
        services.categoryService.getAllCategories(authToken),
      ])

      // Convert guides to view models
      const guideViewModels: GuideViewModel[] = allGuides.map(guide => {
        const category = allCategories.find(c => c.id === guide.categoryId)
        return createGuideViewModel(guide, category?.name || 'Uncategorized')
      })

      setGuides(guideViewModels)

      // Extract unique category names and prepend "All Guides"
      const categoryNames = Array.from(
        new Set(allCategories.map(c => c.name))
      ).sort()
      setCategories(['All Guides', ...categoryNames])

      // Reset category filter if it's no longer available
      if (selectedCategory !== 'All Guides' && !categoryNames.includes(selectedCategory)) {
        setSelectedCategory('All Guides')
      }
    } catch (err) {
      ErrorReporter.capture(err, { component: 'BrowseGuidesScreen', action: 'loadData' })
      console.error('Failed to load guides:', err)
      setError(err instanceof Error ? err.message : 'Failed to load guides')
    } finally {
      setRefreshing(false)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
  }

  // Filter guides based on search and category
  const filteredGuides = useMemo(() => {
    return guides.filter(guide => {
      const matchesSearch =
        guide.title.toLowerCase().includes(searchText.toLowerCase()) ||
        (guide.description && guide.description.toLowerCase().includes(searchText.toLowerCase()))

      const matchesCategory =
        selectedCategory === 'All Guides' || guide.categoryName === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [guides, searchText, selectedCategory])

  // Show loading state
  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} testID={testID}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} testID={`${testID}:back`}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Browse Guides</Text>
          <View style={{ width: 50 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} testID={testID}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} testID={`${testID}:back`}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Browse Guides</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Node Progress Indicator - visual flourish */}
      <View style={styles.progressIndicatorContainer}>
        <NodeProgressIndicator currentStep={3} totalSteps={5} variant="compact" />
      </View>

      {error && <Text style={commonStyles.errorText}>{error}</Text>}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Search Bar */}
        <View style={styles.searchSection}>
          <SearchBar
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search guides..."
            testID={`${testID}:search`}
          />
        </View>

        {/* Category Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categorySection}
          contentContainerStyle={styles.categoryChipsContainer}
        >
          {categories.map(category => (
            <CategoryChip
              key={category}
              label={category}
              selected={selectedCategory === category}
              onPress={() => setSelectedCategory(category)}
              testID={`${testID}:chip-${category}`}
            />
          ))}
        </ScrollView>

        {/* Popular Guides Section */}
        <View style={styles.guidesSection}>
          {filteredGuides.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>
                {selectedCategory === 'All Guides'
                  ? 'Popular Guides'
                  : `${selectedCategory} Guides`}
              </Text>
              {filteredGuides.map(guide => (
                <GuideCard
                  key={guide.id}
                  guide={guide}
                  onPress={() => onViewGuide(guide.id)}
                  testID={`${testID}:card-${guide.id}`}
                />
              ))}
            </>
          ) : (
            <View style={styles.emptyStateContainer}>
              <EmptyState
                icon="📭"
                message={`No guides found for "${searchText}" in ${selectedCategory}`}
                actionLabel="Reset Filters"
                onAction={() => {
                  setSearchText('')
                  setSelectedCategory('All Guides')
                }}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  title: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
  },
  progressIndicatorContainer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  categorySection: {
    paddingLeft: spacing.xl,
    paddingBottom: spacing.lg,
    marginBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryChipsContainer: {
    paddingRight: spacing.xl,
  },
  guidesSection: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightSemibold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  emptyStateContainer: {
    paddingVertical: spacing.xxxl,
  },
})
