import { renderHook, act } from '@testing-library/react-native'
import { AppState } from 'react-native'
import { useSyncConnection, ISyncClient, SyncClientFactory } from './useSyncConnection'
import { SyncEventEmitter } from '../../common/SyncEventEmitter'

class FakeSyncClient implements ISyncClient {
  connectCallCount = 0
  disconnectCallCount = 0
  private _isConnected = false

  connect(): void {
    this.connectCallCount++
    this._isConnected = true
  }

  disconnect(): void {
    this.disconnectCallCount++
    this._isConnected = false
  }

  get isConnected(): boolean {
    return this._isConnected
  }

  simulateDisconnect(): void {
    this._isConnected = false
  }
}

function makeFactory(client: FakeSyncClient): SyncClientFactory {
  return (_serverUrl, _authToken, _onMessage) => client
}

describe('useSyncConnection', () => {
  it('does not create a client when serverUrl is null', () => {
    let factoryCalled = false
    const factory: SyncClientFactory = () => {
      factoryCalled = true
      return new FakeSyncClient()
    }

    renderHook(() =>
      useSyncConnection({
        serverUrl: null,
        authToken: 'token',
        clientFactory: factory,
      }),
    )

    expect(factoryCalled).toBe(false)
  })

  it('does not create a client when authToken is null', () => {
    let factoryCalled = false
    const factory: SyncClientFactory = () => {
      factoryCalled = true
      return new FakeSyncClient()
    }

    renderHook(() =>
      useSyncConnection({
        serverUrl: 'https://guidr.madebysteven.nl',
        authToken: null,
        clientFactory: factory,
      }),
    )

    expect(factoryCalled).toBe(false)
  })

  it('creates client and calls connect when both credentials are available', () => {
    const fakeClient = new FakeSyncClient()

    renderHook(() =>
      useSyncConnection({
        serverUrl: 'https://guidr.madebysteven.nl',
        authToken: 'my-token',
        clientFactory: makeFactory(fakeClient),
      }),
    )

    expect(fakeClient.connectCallCount).toBe(1)
  })

  it('passes serverUrl and authToken to the factory', () => {
    let capturedUrl = ''
    let capturedToken = ''
    const factory: SyncClientFactory = (serverUrl, authToken) => {
      capturedUrl = serverUrl
      capturedToken = authToken
      return new FakeSyncClient()
    }

    renderHook(() =>
      useSyncConnection({
        serverUrl: 'https://guidr.madebysteven.nl',
        authToken: 'tok-xyz',
        clientFactory: factory,
      }),
    )

    expect(capturedUrl).toBe('https://guidr.madebysteven.nl')
    expect(capturedToken).toBe('tok-xyz')
  })

  it('calls disconnect on unmount', () => {
    const fakeClient = new FakeSyncClient()

    const { unmount } = renderHook(() =>
      useSyncConnection({
        serverUrl: 'https://guidr.madebysteven.nl',
        authToken: 'my-token',
        clientFactory: makeFactory(fakeClient),
      }),
    )

    unmount()

    expect(fakeClient.disconnectCallCount).toBe(1)
  })

  it('disconnects old client and connects new one when credentials change', () => {
    const fakeClient1 = new FakeSyncClient()
    const fakeClient2 = new FakeSyncClient()
    let callCount = 0
    const factory: SyncClientFactory = () => {
      callCount++
      return callCount === 1 ? fakeClient1 : fakeClient2
    }

    const { rerender } = renderHook(
      (props: { serverUrl: string; authToken: string }) =>
        useSyncConnection({
          serverUrl: props.serverUrl,
          authToken: props.authToken,
          clientFactory: factory,
        }),
      {
        initialProps: {
          serverUrl: 'https://guidr.madebysteven.nl',
          authToken: 'token-1',
        },
      },
    )

    expect(fakeClient1.connectCallCount).toBe(1)

    act(() => {
      rerender({
        serverUrl: 'https://guidr.madebysteven.nl',
        authToken: 'token-2',
      })
    })

    expect(fakeClient1.disconnectCallCount).toBe(1)
    expect(fakeClient2.connectCallCount).toBe(1)
  })

  it('handles "welcome" messages without emitting to SyncEventEmitter', () => {
    let capturedHandler!: (message: { type: string; payload?: Record<string, unknown> }) => void
    const factory: SyncClientFactory = (_url, _token, onMessage) => {
      capturedHandler = onMessage
      return new FakeSyncClient()
    }

    renderHook(() =>
      useSyncConnection({
        serverUrl: 'https://guidr.madebysteven.nl',
        authToken: 'token',
        clientFactory: factory,
      }),
    )

    // Calling handleMessage with 'welcome' should not throw and should return early
    expect(() => capturedHandler({ type: 'welcome' })).not.toThrow()
  })

  it('emits non-welcome messages to SyncEventEmitter', () => {
    const emitSpy = jest.spyOn(SyncEventEmitter, 'emit')

    let capturedHandler!: (message: { type: string; payload?: Record<string, unknown> }) => void
    const factory: SyncClientFactory = (_url, _token, onMessage) => {
      capturedHandler = onMessage
      return new FakeSyncClient()
    }

    renderHook(() =>
      useSyncConnection({
        serverUrl: 'https://guidr.madebysteven.nl',
        authToken: 'token',
        clientFactory: factory,
      }),
    )

    const payload = { guideId: 'g-1' }
    capturedHandler({ type: 'guide_updated', payload })

    expect(emitSpy).toHaveBeenCalledWith('guide_updated', payload)

    emitSpy.mockRestore()
  })

  it('emits non-welcome message with empty payload when payload is absent', () => {
    const emitSpy = jest.spyOn(SyncEventEmitter, 'emit')

    let capturedHandler!: (message: { type: string; payload?: Record<string, unknown> }) => void
    const factory: SyncClientFactory = (_url, _token, onMessage) => {
      capturedHandler = onMessage
      return new FakeSyncClient()
    }

    renderHook(() =>
      useSyncConnection({
        serverUrl: 'https://guidr.madebysteven.nl',
        authToken: 'token',
        clientFactory: factory,
      }),
    )

    capturedHandler({ type: 'ping' })

    expect(emitSpy).toHaveBeenCalledWith('ping', {})

    emitSpy.mockRestore()
  })

  it('reconnects and calls onReconnect when app returns to foreground while disconnected', () => {
    const mockAppState = AppState as jest.Mocked<typeof AppState>
    mockAppState.addEventListener.mockClear()

    const fakeClient = new FakeSyncClient()
    const onReconnect = jest.fn()

    renderHook(() =>
      useSyncConnection({
        serverUrl: 'https://guidr.madebysteven.nl',
        authToken: 'token',
        onReconnect,
        clientFactory: makeFactory(fakeClient),
      }),
    )

    // Simulate disconnect
    fakeClient.simulateDisconnect()

    // Simulate app coming to foreground — use the most recent registered handler
    const calls = mockAppState.addEventListener.mock.calls
    const handler = calls[calls.length - 1]![1]
    act(() => {
      handler('active')
    })

    expect(fakeClient.connectCallCount).toBe(2) // initial + reconnect
    expect(onReconnect).toHaveBeenCalledTimes(1)
  })

  it('does not reconnect when app returns to foreground while already connected', () => {
    const mockAppState = AppState as jest.Mocked<typeof AppState>
    mockAppState.addEventListener.mockClear()

    const fakeClient = new FakeSyncClient()
    const onReconnect = jest.fn()

    renderHook(() =>
      useSyncConnection({
        serverUrl: 'https://guidr.madebysteven.nl',
        authToken: 'token',
        onReconnect,
        clientFactory: makeFactory(fakeClient),
      }),
    )

    // Client is still connected - do NOT disconnect
    const calls = mockAppState.addEventListener.mock.calls
    const handler = calls[calls.length - 1]![1]
    act(() => {
      handler('active')
    })

    // Should still be 1 (no extra reconnect)
    expect(fakeClient.connectCallCount).toBe(1)
    expect(onReconnect).not.toHaveBeenCalled()
  })

  it('does not attempt reconnect when app goes to background', () => {
    const mockAppState = AppState as jest.Mocked<typeof AppState>
    mockAppState.addEventListener.mockClear()

    const fakeClient = new FakeSyncClient()

    renderHook(() =>
      useSyncConnection({
        serverUrl: 'https://guidr.madebysteven.nl',
        authToken: 'token',
        clientFactory: makeFactory(fakeClient),
      }),
    )

    fakeClient.simulateDisconnect()

    const calls = mockAppState.addEventListener.mock.calls
    const handler = calls[calls.length - 1]![1]
    act(() => {
      handler('background')
    })

    // No additional connect calls
    expect(fakeClient.connectCallCount).toBe(1)
  })

  it('removes AppState subscription on unmount', () => {
    const mockAppState = AppState as jest.Mocked<typeof AppState>
    const removeMock = jest.fn()
    mockAppState.addEventListener.mockReturnValue({ remove: removeMock })

    const { unmount } = renderHook(() =>
      useSyncConnection({
        serverUrl: 'https://guidr.madebysteven.nl',
        authToken: 'token',
        clientFactory: makeFactory(new FakeSyncClient()),
      }),
    )

    unmount()

    expect(removeMock).toHaveBeenCalled()
  })
})
