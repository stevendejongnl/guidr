import { AuthStorage } from '../infrastructure/storage/AuthStorage'
import { ServerConfigStorage } from '../infrastructure/storage/ServerConfigStorage'
import { AuthClient } from '../infrastructure/api/AuthClient'
import { GuideService } from '../domain/services/GuideService'
import { SessionService } from '../domain/services/SessionService'
import { CategoryService } from '../domain/services/CategoryService'
import { Guide } from '../domain/entities/Guide'
import { Session } from '../domain/entities/Session'
import { Category } from '../domain/entities/Category'

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
  getGuideById: jest.fn(),
  getGuidesByCategoryId: jest.fn(),
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
  startSession: jest.fn().mockResolvedValue(undefined),
  pauseSession: jest.fn().mockResolvedValue(undefined),
  resumeSession: jest.fn().mockResolvedValue(undefined),
  completeSession: jest.fn().mockResolvedValue(undefined),
  cancelSession: jest.fn().mockResolvedValue(undefined),
  moveToStep: jest.fn().mockResolvedValue(undefined),
  ...overrides,
} as unknown as jest.Mocked<SessionService>)

/**
 * Create a mock CategoryService instance for testing
 * @param categories Optional list of categories to return
 * @param overrides Optional method overrides
 */
export const createMockCategoryService = (
  categories: Category[] = [],
  overrides: Partial<jest.Mocked<CategoryService>> = {},
): jest.Mocked<CategoryService> => ({
  getAllCategories: jest.fn().mockResolvedValue(categories),
  getCategoryById: jest.fn(),
  ...overrides,
} as unknown as jest.Mocked<CategoryService>)
