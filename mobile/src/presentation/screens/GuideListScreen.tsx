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
}

export const GuideListScreen: React.FC<GuideListScreenProps> = ({
  categoryId,
  onCreateGuide,
  onViewGuide,
  onBack,
}) => {
  const [guides, setGuides] = useState<Guide[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const authStorage = new AuthStorage()
  const serverConfigStorage = new ServerConfigStorage()

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

      const guideRepository = new GuideRepository(serverUrl)
      const stepRepository = new StepRepository(serverUrl)
      const guideService = new GuideService(guideRepository, stepRepository)

      // Load guides
      let loadedGuides: Guide[]
      if (categoryId) {
        loadedGuides = await guideService.getGuidesByCategoryId(categoryId, authToken)
      } else {
        loadedGuides = await guideService.getAllGuides(authToken)
      }
      setGuides(loadedGuides)

      // Load categories for category name mapping
      const categoryRepository = new CategoryRepository(serverUrl)
      const categoryService = new CategoryService(categoryRepository)
      const loadedCategories = await categoryService.getAllCategories(authToken)
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
    loadGuides()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId])

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

  // Filter guides based on search query
  const filteredGuides = useMemo(() => {
    if (!searchQuery.trim()) {
      return guideViewModels
    }

    const query = searchQuery.toLowerCase()
    return guideViewModels.filter(
      guide =>
        guide.title.toLowerCase().includes(query) ||
        guide.description?.toLowerCase().includes(query) ||
        guide.categoryName.toLowerCase().includes(query)
    )
  }, [guideViewModels, searchQuery])

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
  listContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  cardWrapper: {
    marginBottom: spacing.sm,
  },
})
