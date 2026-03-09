import { renderHook, act } from '@testing-library/react-native'
import { useSyncConnection, ISyncClient, SyncClientFactory } from './useSyncConnection'

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
})
