import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native'
import { AuthStorage } from '../../infrastructure/storage/AuthStorage'
import { CategoryService } from '../../domain/services/CategoryService'
import { CategoryRepository } from '../../infrastructure/repositories/CategoryRepository'
import { ServerConfigStorage } from '../../infrastructure/storage/ServerConfigStorage'
import { Category } from '../../domain/entities/Category'
import { SafeScreen } from '../components/SafeScreen'
import { CategoryListItem } from '../components/CategoryListItem'
import { EmptyState } from '../components/EmptyState'
import { ErrorReporter } from '../../infrastructure/monitoring/ErrorReporter'
import { colors, spacing, commonStyles } from '../theme'

interface CategoryListScreenProps {
  parentId?: string | null
  onCreateCategory: () => void
  onEditCategory: (categoryId: string) => void
  onBack: () => void
}

export const CategoryListScreen: React.FC<CategoryListScreenProps> = ({
  parentId = null,
  onCreateCategory,
  onEditCategory,
  onBack,
}) => {
  const [categories, setCategories] = useState<Category[]>([])
  const [childrenCount, setChildrenCount] = useState<Record<string, number>>({})
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const authStorage = new AuthStorage()
  const serverConfigStorage = new ServerConfigStorage()

  const loadCategories = async () => {
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

      const repository = new CategoryRepository(serverUrl)
      const service = new CategoryService(repository)

      // Load categories for the current level
      const loadedCategories = await service.getCategoriesByParentId(parentId, authToken)
      setCategories(loadedCategories)

      // Count children for each category
      const allCategories = await service.getAllCategories(authToken)
      const counts: Record<string, number> = {}
      loadedCategories.forEach(cat => {
        counts[cat.id] = allCategories.filter(c => c.parentId === cat.id).length
      })
      setChildrenCount(counts)
    } catch (err) {
      ErrorReporter.capture(err, { component: 'CategoryListScreen', action: 'loadCategories' })
      console.error('Failed to load categories:', err)
      setError(err instanceof Error ? err.message : 'Failed to load categories')
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentId])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadCategories()
  }

  const handleCategoryPress = (category: Category) => {
    if ((childrenCount[category.id] ?? 0) > 0) {
      // Navigate to child categories
      // This would be handled by parent component through callback
      onEditCategory(category.id)
    } else {
      // Edit category with no children
      onEditCategory(category.id)
    }
  }

  return (
    <SafeScreen testID="category-list-screen">
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} testID="back-button">
            <Text style={commonStyles.linkText}>← Back</Text>
          </TouchableOpacity>
          <Text style={commonStyles.titleLarge}>Categories</Text>
          <TouchableOpacity onPress={onCreateCategory}>
            <Text style={commonStyles.linkText}>+ New</Text>
          </TouchableOpacity>
        </View>

        {error && <Text style={commonStyles.errorText}>{error}</Text>}

        {categories.length === 0 ? (
          <EmptyState
            icon="📭"
            message="No categories yet"
            actionLabel="Create Category"
            onAction={onCreateCategory}
          />
        ) : (
          <View style={styles.listContainer}>
            {categories.map(category => (
              <View key={category.id} style={styles.categoryItem}>
                <CategoryListItem
                  category={category}
                  hasChildren={(childrenCount[category.id] ?? 0) > 0}
                  onPress={handleCategoryPress}
                />
                <Text>{category.name}</Text>
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
  listContainer: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    padding: spacing.md,
    paddingRight: spacing.lg,
  },
  deleteButtonText: {
    fontSize: 18,
    color: colors.danger,
  },
})
