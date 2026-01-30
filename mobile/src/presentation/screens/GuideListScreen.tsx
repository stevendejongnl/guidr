import React, { useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native'
import { AuthStorage } from '../../infrastructure/storage/AuthStorage'
import { GuideService } from '../../domain/services/GuideService'
import { GuideRepository } from '../../infrastructure/repositories/GuideRepository'
import { StepRepository } from '../../infrastructure/repositories/StepRepository'
import { CategoryService } from '../../domain/services/CategoryService'
import { CategoryRepository } from '../../infrastructure/repositories/CategoryRepository'
import { ServerConfigStorage } from '../../infrastructure/storage/ServerConfigStorage'
import { Guide } from '../../domain/entities/Guide'
import { Category } from '../../domain/entities/Category'
import { SafeScreen } from '../components/SafeScreen'
import { GuideCard } from '../components/GuideCard'
import { SearchBar } from '../components/SearchBar'
import { EmptyState } from '../components/EmptyState'
import { ErrorReporter } from '../../infrastructure/monitoring/ErrorReporter'
import { createGuideViewModel } from '../viewmodels/GuideViewModel'
import { colors, spacing, commonStyles } from '../theme'

interface GuideListScreenProps {
  categoryId?: string
  onCreateGuide: (categoryId?: string) => void
  onEditGuide: (guideId: string) => void
  onViewGuide: (guideId: string) => void
  onBack: () => void
  // Optional dependency injection
  guideService?: GuideService
  categoryService?: CategoryService
  authStorage?: AuthStorage
  serverConfigStorage?: ServerConfigStorage
}

export const GuideListScreen: React.FC<GuideListScreenProps> = ({
  categoryId,
  onCreateGuide,
  onViewGuide,
  onBack,
  guideService: injectedGuideService,
  categoryService: injectedCategoryService,
  authStorage: injectedAuthStorage,
  serverConfigStorage: injectedServerConfigStorage,
}) => {
  const [guides, setGuides] = useState<Guide[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTab, setFilterTab] = useState<'all' | 'mine' | 'public'>('all')
  const [userId, setUserId] = useState<string | null>(null)

  const authStorage = injectedAuthStorage || new AuthStorage()
  const serverConfigStorage = injectedServerConfigStorage || new ServerConfigStorage()

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

  const loadGuides = async () => {
    try {
      setError(null)

      const authToken = await authStorage.getAuthToken()
      if (!authToken) {
        throw new Error('No auth token found')
      }

      const serverUrl = await serverConfigStorage.getServerUrl()
      if (!serverUrl) {
        throw new Error('No server URL configured')
      }

      const services = getServices(serverUrl)

      // Load guides
      let loadedGuides: Guide[]
      if (categoryId) {
        loadedGuides = await services.guideService.getGuidesByCategoryId(categoryId, authToken)
      } else {
        loadedGuides = await services.guideService.getAllGuides(authToken)
      }
      setGuides(loadedGuides)

      // Load categories for category name mapping
      const loadedCategories = await services.categoryService.getAllCategories(authToken)
      setCategories(loadedCategories)
    } catch (err) {
      ErrorReporter.capture(err, { component: 'GuideListScreen', action: 'loadGuides' })
      console.error('Failed to load guides:', err)
      setError(err instanceof Error ? err.message : 'Failed to load guides')
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    const loadUserId = async () => {
      const id = await authStorage.getUserId()
      setUserId(id)
    }
    loadUserId()
    loadGuides()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, injectedGuideService, injectedCategoryService])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadGuides()
  }

  // Create a mapping of category ID to name for quick lookup
  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {}
    categories.forEach(cat => {
      map[cat.id] = cat.name
    })
    return map
  }, [categories])

  // Convert guides to viewmodels
  const guideViewModels = useMemo(() => {
    return guides.map(guide => {
      const categoryName = categoryMap[guide.categoryId] || 'Unknown'
      return createGuideViewModel(guide, categoryName)
    })
  }, [guides, categoryMap])

  // Filter guides based on search query and filter tab
  const filteredGuides = useMemo(() => {
    let filtered = guideViewModels

    // Apply filter tab
    if (filterTab === 'mine' && userId) {
      filtered = filtered.filter(guide => guide.createdByUserId === userId)
    } else if (filterTab === 'public') {
      filtered = filtered.filter(guide => guide.isPublic)
    }

    // Apply search query
    if (!searchQuery.trim()) {
      return filtered
    }

    const query = searchQuery.toLowerCase()
    return filtered.filter(
      guide =>
        guide.title.toLowerCase().includes(query) ||
        guide.description?.toLowerCase().includes(query) ||
        guide.categoryName.toLowerCase().includes(query)
    )
  }, [guideViewModels, searchQuery, filterTab, userId])

  return (
    <SafeScreen testID="guide-list-screen">
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} testID="back-button">
            <Text style={commonStyles.linkText}>← Back</Text>
          </TouchableOpacity>
          <Text style={commonStyles.titleLarge}>Guides</Text>
          <TouchableOpacity onPress={() => onCreateGuide(categoryId)}>
            <Text style={commonStyles.linkText}>+ New</Text>
          </TouchableOpacity>
        </View>

        {error && <Text style={commonStyles.errorText}>{error}</Text>}

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search guides..."
            testID="search-guides"
          />
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          <TouchableOpacity
            style={[
              styles.filterTab,
              filterTab === 'all' && styles.filterTabActive,
            ]}
            onPress={() => setFilterTab('all')}
            testID="filter-tab-all"
          >
            <Text style={[
              styles.filterTabText,
              filterTab === 'all' && styles.filterTabTextActive,
            ]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterTab,
              filterTab === 'mine' && styles.filterTabActive,
            ]}
            onPress={() => setFilterTab('mine')}
            testID="filter-tab-mine"
          >
            <Text style={[
              styles.filterTabText,
              filterTab === 'mine' && styles.filterTabTextActive,
            ]}>
              My Guides
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterTab,
              filterTab === 'public' && styles.filterTabActive,
            ]}
            onPress={() => setFilterTab('public')}
            testID="filter-tab-public"
          >
            <Text style={[
              styles.filterTabText,
              filterTab === 'public' && styles.filterTabTextActive,
            ]}>
              Public
            </Text>
          </TouchableOpacity>
        </View>

        {filteredGuides.length === 0 ? (
          <EmptyState
            icon="📚"
            message={searchQuery ? 'No guides match your search' : 'No guides yet'}
            actionLabel={searchQuery ? 'Clear search' : 'Create Guide'}
            onAction={searchQuery ? () => setSearchQuery('') : () => onCreateGuide(categoryId)}
          />
        ) : (
          <View style={styles.listContainer}>
            {filteredGuides.map(guideViewModel => (
              <View key={guideViewModel.id} style={styles.cardWrapper}>
                <GuideCard
                  guide={guideViewModel}
                  onPress={() => onViewGuide(guideViewModel.id)}
                  testID={`guide-card-${guideViewModel.id}`}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeScreen>
  )
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.xl,
    paddingBottom: spacing.lg,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  filterTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.inputBackground,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterTabText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: colors.textPrimary,
  },
  listContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  cardWrapper: {
    marginBottom: spacing.sm,
  },
})
