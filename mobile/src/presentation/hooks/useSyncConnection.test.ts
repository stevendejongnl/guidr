import { renderHook } from '@testing-library/react-native'
import { useSyncConnection } from './useSyncConnection'
import { WebSocketSyncClient } from '../../infrastructure/api/WebSocketSyncClient'

// Mock WebSocketSyncClient
jest.mock('../../infrastructure/api/WebSocketSyncClient')

const MockWebSocketSyncClient = WebSocketSyncClient as jest.MockedClass<typeof WebSocketSyncClient>

describe('useSyncConnection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    MockWebSocketSyncClient.mockClear()

    // Setup mock prototype
    MockWebSocketSyncClient.prototype.connect = jest.fn()
    MockWebSocketSyncClient.prototype.disconnect = jest.fn()
    Object.defineProperty(MockWebSocketSyncClient.prototype, 'isConnected', {
      get: jest.fn().mockReturnValue(false),
      configurable: true,
    })
  })

  it('does not connect when serverUrl is null', () => {
    renderHook(() =>
      useSyncConnection({
        serverUrl: null,
        authToken: 'token',
      }),
    )

    expect(MockWebSocketSyncClient).not.toHaveBeenCalled()
  })

  it('does not connect when authToken is null', () => {
    renderHook(() =>
      useSyncConnection({
        serverUrl: 'https://api.guidr.app',
        authToken: null,
      }),
    )

    expect(MockWebSocketSyncClient).not.toHaveBeenCalled()
  })

  it('creates client and connects when both credentials available', () => {
    renderHook(() =>
      useSyncConnection({
        serverUrl: 'https://api.guidr.app',
        authToken: 'my-token',
      }),
    )

    expect(MockWebSocketSyncClient).toHaveBeenCalledWith(
      'https://api.guidr.app',
      'my-token',
      expect.any(Function),
    )
    expect(MockWebSocketSyncClient.prototype.connect).toHaveBeenCalled()
  })

  it('disconnects on unmount', () => {
    const { unmount } = renderHook(() =>
      useSyncConnection({
        serverUrl: 'https://api.guidr.app',
        authToken: 'my-token',
      }),
    )

    unmount()

    expect(MockWebSocketSyncClient.prototype.disconnect).toHaveBeenCalled()
  })

  it('reconnects when credentials change', () => {
    const { rerender } = renderHook(
      (props: { serverUrl: string; authToken: string }) =>
        useSyncConnection({ serverUrl: props.serverUrl, authToken: props.authToken }),
      {
        initialProps: {
          serverUrl: 'https://api.guidr.app',
          authToken: 'token-1',
        },
      },
    )

    expect(MockWebSocketSyncClient.prototype.connect).toHaveBeenCalledTimes(1)

    rerender({
      serverUrl: 'https://api.guidr.app',
      authToken: 'token-2',
    })

    // Should disconnect old and connect new
    expect(MockWebSocketSyncClient.prototype.disconnect).toHaveBeenCalled()
    expect(MockWebSocketSyncClient).toHaveBeenCalledTimes(2)
  })
})
