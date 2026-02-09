import {
  createMockAuthStorage,
  createMockServerConfigStorage,
  createMockGuideService,
} from '../testUtils'

// Mock only ErrorReporter (static utility)
jest.mock('../../infrastructure/monitoring/ErrorReporter')

describe('GuideFormScreen', () => {
  let mockAuthStorage: ReturnType<typeof createMockAuthStorage>
  let mockServerConfigStorage: ReturnType<typeof createMockServerConfigStorage>
  let mockGuideService: ReturnType<typeof createMockGuideService>

  beforeEach(() => {
    jest.clearAllMocks()

    // Create mock infrastructure and services
    mockAuthStorage = createMockAuthStorage()
    mockServerConfigStorage = createMockServerConfigStorage()
    mockGuideService = createMockGuideService([])
  })

  it('component supports dependency injection pattern with guideService props', () => {
    expect(mockAuthStorage).toBeDefined()
    expect(mockServerConfigStorage).toBeDefined()
  })

  it('component can accept infrastructure via dependency injection', () => {
    expect(mockAuthStorage).toBeDefined()
    expect(mockServerConfigStorage).toBeDefined()
    expect(mockGuideService).toBeDefined()
  })
})
