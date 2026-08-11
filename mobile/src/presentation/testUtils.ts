import { AuthStorage } from '../infrastructure/storage/AuthStorage'
import { ServerConfigStorage } from '../infrastructure/storage/ServerConfigStorage'
import { NotificationPreferencesStorage } from '../infrastructure/storage/NotificationPreferencesStorage'
import { AuthClient } from '../infrastructure/api/AuthClient'
import { GuideFavoriteClient } from '../infrastructure/api/GuideFavoriteClient'
import { StepTimerClient } from '../infrastructure/api/StepTimerClient'
import { GuideService } from '../domain/services/GuideService'
import { SessionService } from '../domain/services/SessionService'
import { StepService } from '../domain/services/StepService'
import { Guide } from '../domain/entities/Guide'
import { Session } from '../domain/entities/Session'
import { Step } from '../domain/entities/Step'
import { HealthCheckService } from '../domain/services/HealthCheckService'
import { NotificationService } from '../infrastructure/native/NotificationService'
import { GitHubReleaseClient, GitHubRelease } from '../infrastructure/api/GitHubReleaseClient'
import { UpdateCheckStorage } from '../infrastructure/storage/UpdateCheckStorage'
import { ServerConfigClient, ServerConfigResponse } from '../infrastructure/api/ServerConfigClient'
import { TokenRefreshService } from '../infrastructure/api/TokenRefreshService'

/**
 * Create a mock AuthStorage instance for testing
 * @param overrides Optional method overrides
 */
export const createMockAuthStorage = (overrides: Partial<jest.Mocked<AuthStorage>> = {}): jest.Mocked<AuthStorage> => ({
  getAuthToken: jest.fn().mockResolvedValue('test-token'),
  setAuthToken: jest.fn().mockResolvedValue(undefined),
  hasAuthToken: jest.fn().mockResolvedValue(true),
  clearAuthToken: jest.fn().mockResolvedValue(undefined),
  getRefreshToken: jest.fn().mockResolvedValue('test-refresh-token'),
  setRefreshToken: jest.fn().mockResolvedValue(undefined),
  clearRefreshToken: jest.fn().mockResolvedValue(undefined),
  getUserEmail: jest.fn().mockResolvedValue('test@example.com'),
  setUserEmail: jest.fn().mockResolvedValue(undefined),
  clearUserEmail: jest.fn().mockResolvedValue(undefined),
  getUserIsAdmin: jest.fn().mockResolvedValue(false),
  setUserIsAdmin: jest.fn().mockResolvedValue(undefined),
  clearUserIsAdmin: jest.fn().mockResolvedValue(undefined),
  getUserId: jest.fn().mockResolvedValue('user-123'),
  setUserId: jest.fn().mockResolvedValue(undefined),
  clearUserId: jest.fn().mockResolvedValue(undefined),
  clearAll: jest.fn().mockResolvedValue(undefined),
  ...overrides,
} as unknown as jest.Mocked<AuthStorage>)

/**
 * Create a mock ServerConfigStorage instance for testing
 * @param overrides Optional method overrides
 */
export const createMockServerConfigStorage = (
  overrides: Partial<jest.Mocked<ServerConfigStorage>> = {},
): jest.Mocked<ServerConfigStorage> => ({
  getServerUrl: jest.fn().mockResolvedValue('http://localhost:8000'),
  setServerUrl: jest.fn().mockResolvedValue(undefined),
  hasServerUrl: jest.fn().mockResolvedValue(true),
  clearServerUrl: jest.fn().mockResolvedValue(undefined),
  initializeDefaultServerUrl: jest.fn().mockResolvedValue(undefined),
  getDefaultServerUrl: jest.fn().mockResolvedValue('http://localhost:8000'),
  ...overrides,
} as unknown as jest.Mocked<ServerConfigStorage>)

/**
 * Create a mock AuthClient instance for testing
 * @param overrides Optional method overrides
 */
export const createMockAuthClient = (overrides: Partial<jest.Mocked<AuthClient>> = {}): jest.Mocked<AuthClient> => ({
  login: jest.fn().mockResolvedValue({
    accessToken: 'test-token',
    refreshToken: 'test-refresh-token',
    tokenType: 'Bearer',
    user: {
      id: 'user-1',
      email: 'test@example.com',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isAdmin: false,
    },
  }),
  register: jest.fn().mockResolvedValue({
    accessToken: 'test-token',
    refreshToken: 'test-refresh-token',
    tokenType: 'Bearer',
    user: {
      id: 'user-1',
      email: 'test@example.com',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isAdmin: false,
    },
  }),
  getProfile: jest.fn().mockResolvedValue({
    id: 'user-1',
    email: 'test@example.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    name: 'Test User',
    interests: [],
    isAdmin: false,
  }),
  changePassword: jest.fn().mockResolvedValue(undefined),
  changeEmail: jest.fn().mockResolvedValue({
    accessToken: 'test-token',
    refreshToken: 'test-refresh-token',
    tokenType: 'Bearer',
    user: {
      id: 'user-1',
      email: 'newemail@example.com',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isAdmin: false,
    },
  }),
  refreshToken: jest.fn().mockResolvedValue({
    accessToken: 'new-test-token',
    refreshToken: 'new-test-refresh-token',
    tokenType: 'Bearer',
    user: {
      id: 'user-1',
      email: 'test@example.com',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isAdmin: false,
    },
  }),
  updateProfile: jest.fn().mockResolvedValue({
    id: 'user-1',
    email: 'test@example.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    name: 'Test User',
    interests: ['interest1'],
  }),
  deleteAccount: jest.fn().mockResolvedValue(undefined),
  ...overrides,
} as unknown as jest.Mocked<AuthClient>)

/**
 * Create a mock GuideService instance for testing
 * @param guides Optional list of guides to return
 * @param overrides Optional method overrides
 */
export const createMockGuideService = (
  guides: Guide[] = [],
  overrides: Partial<jest.Mocked<GuideService>> = {},
): jest.Mocked<GuideService> => ({
  getAllGuides: jest.fn().mockResolvedValue(guides),
  getMyGuides: jest.fn().mockResolvedValue(guides),
  getHighlightedGuides: jest.fn().mockResolvedValue([]),
  getGuideById: jest.fn(),
  getGuidesByType: jest.fn(),
  updateGuideLanguage: jest.fn(),
  ...overrides,
} as unknown as jest.Mocked<GuideService>)

/**
 * Create a mock SessionService instance for testing
 * @param sessions Optional list of sessions to return
 * @param overrides Optional method overrides
 */
export const createMockSessionService = (
  sessions: Session[] = [],
  overrides: Partial<jest.Mocked<SessionService>> = {},
): jest.Mocked<SessionService> => ({
  getAllSessions: jest.fn().mockResolvedValue(sessions),
  getSessionById: jest.fn(),
  createSession: jest.fn(),
  getSessionsByStatus: jest.fn(),
  getSessionsByGuideId: jest.fn().mockResolvedValue(sessions),
  startSession: jest.fn().mockResolvedValue(undefined),
  pauseSession: jest.fn().mockResolvedValue(undefined),
  resumeSession: jest.fn().mockResolvedValue(undefined),
  completeSession: jest.fn().mockResolvedValue(undefined),
  cancelSession: jest.fn().mockResolvedValue(undefined),
  moveToStep: jest.fn().mockResolvedValue(undefined),
  deleteSession: jest.fn().mockResolvedValue(undefined),
  ...overrides,
} as unknown as jest.Mocked<SessionService>)

/**
 * Create a mock StepService instance for testing
 * @param steps Optional list of steps to return
 * @param overrides Optional method overrides
 */
export const createMockStepService = (
  steps: Step[] = [],
  overrides: Partial<jest.Mocked<StepService>> = {},
): jest.Mocked<StepService> => ({
  getStepsByGuideId: jest.fn().mockResolvedValue(steps),
  getStepById: jest.fn(),
  createStep: jest.fn(),
  updateStepTitle: jest.fn(),
  updateStepDescription: jest.fn(),
  updateStepDuration: jest.fn(),
  updateStepOrder: jest.fn(),
  deleteStep: jest.fn(),
  ...overrides,
} as unknown as jest.Mocked<StepService>)

/**
 * Create a mock StepTimerClient instance for testing
 * @param overrides Optional method overrides
 */
export const createMockStepTimerClient = (
  overrides: Partial<jest.Mocked<StepTimerClient>> = {},
): jest.Mocked<StepTimerClient> => ({
  startTimer: jest.fn().mockResolvedValue({}),
  pauseTimer: jest.fn().mockResolvedValue({}),
  resetTimer: jest.fn().mockResolvedValue({}),
  getTimersByGuide: jest.fn().mockResolvedValue([]),
  getActiveTimers: jest.fn().mockResolvedValue([]),
  ...overrides,
} as unknown as jest.Mocked<StepTimerClient>)

/**
 * Create a mock GuideFavoriteClient instance for testing
 * @param favoriteIds Optional list of favorite guide IDs to return
 * @param overrides Optional method overrides
 */
export const createMockGuideFavoriteClient = (
  favoriteIds: string[] = [],
  overrides: Partial<jest.Mocked<GuideFavoriteClient>> = {},
): jest.Mocked<GuideFavoriteClient> => ({
  favoriteGuide: jest.fn().mockResolvedValue(undefined),
  unfavoriteGuide: jest.fn().mockResolvedValue(undefined),
  getFavoriteGuideIds: jest.fn().mockResolvedValue(favoriteIds),
  ...overrides,
} as unknown as jest.Mocked<GuideFavoriteClient>)

/**
 * Create a mock NotificationPreferencesStorage for testing
 */
export const createMockNotificationPreferencesStorage = (
  overrides: Partial<jest.Mocked<NotificationPreferencesStorage>> = {},
): jest.Mocked<NotificationPreferencesStorage> => ({
  getTimerNotificationsEnabled: jest.fn().mockResolvedValue(true),
  setTimerNotificationsEnabled: jest.fn().mockResolvedValue(undefined),
  getCriticalNotificationsEnabled: jest.fn().mockResolvedValue(false),
  setCriticalNotificationsEnabled: jest.fn().mockResolvedValue(undefined),
  ...overrides,
} as unknown as jest.Mocked<NotificationPreferencesStorage>)

/**
 * Create a mock HealthCheckService instance for testing
 * @param overrides Optional method overrides
 */
export const createMockHealthCheckService = (
  overrides: Partial<jest.Mocked<HealthCheckService>> = {},
): jest.Mocked<HealthCheckService> => ({
  validateServer: jest.fn().mockResolvedValue({ healthy: true, responseTime: 10 }),
  ...overrides,
} as unknown as jest.Mocked<HealthCheckService>)

/**
 * Create a mock NotificationService instance for testing
 * @param overrides Optional method overrides
 */
export const createMockNotificationService = (
  overrides: Partial<jest.Mocked<NotificationService>> = {},
): jest.Mocked<NotificationService> => ({
  requestPermission: jest.fn().mockResolvedValue(true),
  scheduleTimerNotification: jest.fn().mockResolvedValue(undefined),
  cancelTimerNotification: jest.fn().mockResolvedValue(undefined),
  cancelAllTimerNotifications: jest.fn().mockResolvedValue(undefined),
  showImmediateNotification: jest.fn().mockResolvedValue(undefined),
  ...overrides,
} as unknown as jest.Mocked<NotificationService>)

/**
 * Create GitHubRelease fixture data for testing
 * @param overrides Optional field overrides
 */
export const createGitHubRelease = (overrides: Partial<GitHubRelease> = {}): GitHubRelease => ({
  version: '1.0.0',
  tagName: 'v1.0.0',
  name: 'v1.0.0',
  body: 'Changelog',
  publishedAt: new Date().toISOString(),
  apkUrl: 'https://example.com/guidr.apk',
  isPrerelease: false,
  ...overrides,
})

/**
 * Create a mock GitHubReleaseClient instance for testing
 * @param release Optional release fixture to resolve; defaults via createGitHubRelease()
 * @param overrides Optional method overrides
 */
export const createMockGitHubReleaseClient = (
  release: GitHubRelease = createGitHubRelease(),
  overrides: Partial<jest.Mocked<GitHubReleaseClient>> = {},
): jest.Mocked<GitHubReleaseClient> => ({
  getLatestRelease: jest.fn().mockResolvedValue(release),
  getReleaseByTag: jest.fn().mockResolvedValue(release),
  ...overrides,
} as unknown as jest.Mocked<GitHubReleaseClient>)

/**
 * Create a mock UpdateCheckStorage instance for testing
 * @param overrides Optional method overrides
 */
export const createMockUpdateCheckStorage = (
  overrides: Partial<jest.Mocked<UpdateCheckStorage>> = {},
): jest.Mocked<UpdateCheckStorage> => ({
  getLastCheckTimestamp: jest.fn().mockResolvedValue(null),
  setLastCheckTimestamp: jest.fn().mockResolvedValue(undefined),
  shouldCheckForUpdates: jest.fn().mockResolvedValue(true),
  clearLastCheck: jest.fn().mockResolvedValue(undefined),
  ...overrides,
} as unknown as jest.Mocked<UpdateCheckStorage>)

/**
 * Create a mock ServerConfigClient instance for testing
 * @param config Optional config fixture to resolve
 * @param overrides Optional method overrides
 */
export const createMockServerConfigClient = (
  config: ServerConfigResponse = { minAppVersion: null, maxAppVersion: null },
  overrides: Partial<jest.Mocked<ServerConfigClient>> = {},
): jest.Mocked<ServerConfigClient> => ({
  getConfig: jest.fn().mockResolvedValue(config),
  ...overrides,
} as unknown as jest.Mocked<ServerConfigClient>)

/**
 * Create a mock TokenRefreshService instance for testing
 * @param overrides Optional method overrides
 */
export const createMockTokenRefreshService = (
  overrides: Partial<jest.Mocked<TokenRefreshService>> = {},
): jest.Mocked<TokenRefreshService> => ({
  refreshAndRetry: jest.fn().mockResolvedValue('new-token'),
  ...overrides,
} as unknown as jest.Mocked<TokenRefreshService>)

/**
 * Create a bundle of the domain services AppNavigator wires into child
 * screens once a server URL is available.
 * @param overrides Optional per-service overrides
 */
export const createMockServicesBundle = (overrides: {
  guide?: jest.Mocked<GuideService>
  session?: jest.Mocked<SessionService>
  step?: jest.Mocked<StepService>
  stepTimerClient?: jest.Mocked<StepTimerClient>
  guideFavoriteClient?: jest.Mocked<GuideFavoriteClient>
} = {}) => ({
  guide: overrides.guide ?? createMockGuideService([]),
  session: overrides.session ?? createMockSessionService([]),
  step: overrides.step ?? createMockStepService([]),
  stepTimerClient: overrides.stepTimerClient ?? createMockStepTimerClient(),
  guideFavoriteClient: overrides.guideFavoriteClient ?? createMockGuideFavoriteClient(),
})
