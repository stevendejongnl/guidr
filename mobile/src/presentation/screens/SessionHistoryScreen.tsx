import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { AuthStorage } from '../../infrastructure/storage/AuthStorage'
import { GuideService } from '../../domain/services/GuideService'
import { SessionService } from '../../domain/services/SessionService'
import { Session, SessionStatus } from '../../domain/entities/Session'
import { SafeScreen } from '../components/SafeScreen'
import { colors, spacing } from '@guidr/shared/tokens'
import { commonStyles } from '@guidr/shared/styles/react-native'

interface SessionHistoryScreenProps {
  onBack: () => void
  sessionService: SessionService
  guideService: GuideService
  authStorage: AuthStorage
}

export const SessionHistoryScreen: React.FC<SessionHistoryScreenProps> = ({
  onBack,
  sessionService,
  guideService,
  authStorage,
}) => {
  const [sessions, setSessions] = useState<Session[]>([])
  const [guideNames, setGuideNames] = useState<Record<string, string>>({})
  const [authToken, setAuthToken] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const loadSessions = useCallback(async () => {
    try {
      setError(null)
      setLoading(true)
      const token = await authStorage.getAuthToken()
      const resolvedToken = token ?? ''
      setAuthToken(resolvedToken)
      const loaded = await sessionService.getAllSessions(resolvedToken)
      setSessions(loaded)

      const uniqueGuideIds = [...new Set(loaded.map(s => s.guideId))]
      const names: Record<string, string> = {}
      await Promise.all(
        uniqueGuideIds.map(async guideId => {
          try {
            const guide = await guideService.getGuideById(guideId, resolvedToken)
            if (guide) {
              names[guideId] = guide.title
            }
          } catch {
            // leave guide name empty if not found
          }
        }),
      )
      setGuideNames(names)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }, [authStorage, sessionService, guideService])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  const handleDeletePress = (sessionId: string) => {
    Alert.alert(
      'Delete Session',
      'Are you sure you want to delete this session? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleteError(null)
              await sessionService.deleteSession(sessionId, authToken)
              setSessions(prev => prev.filter(s => s.id !== sessionId))
            } catch (err) {
              setDeleteError(err instanceof Error ? err.message : 'Failed to delete session')
            }
          },
        },
      ],
    )
  }

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString()
  }

  const statusLabel = (status: SessionStatus): string => {
    return status
  }

  return (
    <SafeScreen>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} testID="session-history-back">
          <Text style={commonStyles.linkText}>← Back</Text>
        </TouchableOpacity>
        <Text style={commonStyles.titleLarge}>Session History</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading && (
        <ActivityIndicator
          testID="session-history-loading"
          size="large"
          color={colors.primary}
          style={styles.loader}
        />
      )}

      {!loading && (error || deleteError) && (
        <Text style={commonStyles.errorText}>{error ?? deleteError}</Text>
      )}

      {!loading && !error && sessions.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No sessions yet</Text>
        </View>
      )}

      {!loading && sessions.length > 0 && (
        <ScrollView style={styles.list}>
          {sessions.map(session => (
            <View key={session.id} style={styles.sessionItem} testID={`session-item-${session.id}`}>
              <View style={styles.sessionInfo}>
                {guideNames[session.guideId] ? (
                  <Text style={styles.guideName}>{guideNames[session.guideId]}</Text>
                ) : null}
                <Text style={styles.statusText}>{statusLabel(session.status)}</Text>
                <Text testID={`session-date-${session.id}`} style={styles.dateText}>
                  {formatDate(session.createdAt)}
                </Text>
              </View>
              <TouchableOpacity
                testID={`session-delete-${session.id}`}
                onPress={() => handleDeletePress(session.id)}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

    </SafeScreen>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.xl,
    paddingBottom: spacing.lg,
  },
  headerSpacer: {
    width: 48,
  },
  loader: {
    marginTop: spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  list: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sessionInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  guideName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  statusText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  dateText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  deleteButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 6,
    backgroundColor: colors.danger,
  },
  deleteButtonText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
})
