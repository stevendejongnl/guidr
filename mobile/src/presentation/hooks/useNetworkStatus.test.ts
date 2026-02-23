import { renderHook, act } from '@testing-library/react-native'
import NetInfo from '@react-native-community/netinfo'
import { useNetworkStatus } from './useNetworkStatus'

const mockNetInfo = NetInfo as jest.Mocked<typeof NetInfo>

describe('useNetworkStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns isOnline: true when NetInfo reports connected', () => {
    mockNetInfo.addEventListener.mockImplementation(callback => {
      callback({ isConnected: true, isInternetReachable: true } as never)
      return jest.fn()
    })

    const { result } = renderHook(() => useNetworkStatus())

    expect(result.current.isOnline).toBe(true)
  })

  it('returns isOnline: false when NetInfo reports disconnected', () => {
    mockNetInfo.addEventListener.mockImplementation(callback => {
      callback({ isConnected: false, isInternetReachable: false } as never)
      return jest.fn()
    })

    const { result } = renderHook(() => useNetworkStatus())

    expect(result.current.isOnline).toBe(false)
  })

  it('updates reactively when network state changes', () => {
    let captured: ((state: { isConnected: boolean | null }) => void) | null = null

    mockNetInfo.addEventListener.mockImplementation(callback => {
      captured = callback as (state: { isConnected: boolean | null }) => void
      callback({ isConnected: true, isInternetReachable: true } as never)
      return jest.fn()
    })

    const { result } = renderHook(() => useNetworkStatus())

    expect(result.current.isOnline).toBe(true)

    act(() => {
      captured!({ isConnected: false })
    })

    expect(result.current.isOnline).toBe(false)

    act(() => {
      captured!({ isConnected: true })
    })

    expect(result.current.isOnline).toBe(true)
  })

  it('treats null isConnected as online (optimistic fallback)', () => {
    mockNetInfo.addEventListener.mockImplementation(callback => {
      callback({ isConnected: null, isInternetReachable: null } as never)
      return jest.fn()
    })

    const { result } = renderHook(() => useNetworkStatus())

    expect(result.current.isOnline).toBe(true)
  })

  it('unsubscribes the NetInfo listener on unmount', () => {
    const mockUnsubscribe = jest.fn()
    mockNetInfo.addEventListener.mockImplementation(callback => {
      callback({ isConnected: true, isInternetReachable: true } as never)
      return mockUnsubscribe
    })

    const { unmount } = renderHook(() => useNetworkStatus())

    unmount()

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
  })
})
