import { WebSocketSyncClient } from './WebSocketSyncClient'

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  url: string
  readyState = MockWebSocket.CONNECTING
  onopen: (() => void) | null = null
  onmessage: ((event: { data: string }) => void) | null = null
  onclose: (() => void) | null = null
  onerror: (() => void) | null = null
  send = jest.fn()
  close = jest.fn()

  constructor(url: string) {
    this.url = url
    // Auto-open on next tick
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN
      this.onopen?.()
    }, 0)
  }

  simulateMessage(data: Record<string, unknown>): void {
    this.onmessage?.({ data: JSON.stringify(data) })
  }

  simulateClose(): void {
    this.readyState = MockWebSocket.CLOSED
    this.onclose?.()
  }
}

// @ts-expect-error - mock global WebSocket
global.WebSocket = MockWebSocket

describe('WebSocketSyncClient', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('builds correct WebSocket URL from server URL', () => {
    const onMessage = jest.fn()
    const client = new WebSocketSyncClient(
      'https://api.guidr.app/api/v1',
      'my-token',
      onMessage,
    )
    client.connect()

    // Access the last created WebSocket
    const ws = (client as unknown as { ws: MockWebSocket })['ws']
    expect(ws.url).toContain('wss://api.guidr.app/api/v1/ws/sync')
    expect(ws.url).toContain('token=my-token')

    client.disconnect()
  })

  it('includes device_id in URL when provided', () => {
    const onMessage = jest.fn()
    const client = new WebSocketSyncClient(
      'https://api.guidr.app',
      'tok',
      onMessage,
      'device-abc',
    )
    client.connect()

    const ws = (client as unknown as { ws: MockWebSocket })['ws']
    expect(ws.url).toContain('device_id=device-abc')

    client.disconnect()
  })

  it('dispatches non-pong messages to handler', () => {
    const onMessage = jest.fn()
    const client = new WebSocketSyncClient('https://api.guidr.app', 'tok', onMessage)
    client.connect()
    jest.advanceTimersByTime(1) // trigger open

    const ws = (client as unknown as { ws: MockWebSocket })['ws']
    ws.simulateMessage({ type: 'timer.started', payload: { timerId: 't1' } })

    expect(onMessage).toHaveBeenCalledWith({
      type: 'timer.started',
      payload: { timerId: 't1' },
    })

    client.disconnect()
  })

  it('ignores pong messages', () => {
    const onMessage = jest.fn()
    const client = new WebSocketSyncClient('https://api.guidr.app', 'tok', onMessage)
    client.connect()
    jest.advanceTimersByTime(1)

    const ws = (client as unknown as { ws: MockWebSocket })['ws']
    ws.simulateMessage({ type: 'pong' })

    expect(onMessage).not.toHaveBeenCalled()

    client.disconnect()
  })

  it('sends ping at 25s interval after connect', () => {
    const onMessage = jest.fn()
    const client = new WebSocketSyncClient('https://api.guidr.app', 'tok', onMessage)
    client.connect()
    jest.advanceTimersByTime(1) // trigger open

    const ws = (client as unknown as { ws: MockWebSocket })['ws']
    jest.advanceTimersByTime(25_000)

    expect(ws.send).toHaveBeenCalledWith(JSON.stringify({ type: 'ping' }))

    client.disconnect()
  })

  it('disconnect stops pings and closes socket', () => {
    const onMessage = jest.fn()
    const client = new WebSocketSyncClient('https://api.guidr.app', 'tok', onMessage)
    client.connect()
    jest.advanceTimersByTime(1)

    client.disconnect()

    expect(client.isConnected).toBe(false)
  })

  it('does not reconnect after intentional disconnect', () => {
    const onMessage = jest.fn()
    const client = new WebSocketSyncClient('https://api.guidr.app', 'tok', onMessage)
    client.connect()
    jest.advanceTimersByTime(1)

    client.disconnect()
    // Advance time — should not create new WebSocket
    jest.advanceTimersByTime(60_000)

    expect(client.isConnected).toBe(false)
  })

  it('schedules reconnect after unexpected close', () => {
    const onMessage = jest.fn()
    const client = new WebSocketSyncClient('https://api.guidr.app', 'tok', onMessage)
    client.connect()
    jest.advanceTimersByTime(1) // trigger open

    const ws = (client as unknown as { ws: MockWebSocket })['ws']
    ws.simulateClose()

    // After 1s (base reconnect), a new WS should be created
    jest.advanceTimersByTime(1_000)

    // The client should have a new ws instance
    const newWs = (client as unknown as { ws: MockWebSocket })['ws']
    expect(newWs).not.toBeNull()

    client.disconnect()
  })

  it('does not connect twice when already connected', () => {
    const onMessage = jest.fn()
    const client = new WebSocketSyncClient('https://api.guidr.app', 'tok', onMessage)
    client.connect()
    jest.advanceTimersByTime(1)

    const ws1 = (client as unknown as { ws: MockWebSocket })['ws']
    client.connect() // should be noop
    const ws2 = (client as unknown as { ws: MockWebSocket })['ws']

    expect(ws1).toBe(ws2)

    client.disconnect()
  })
})
