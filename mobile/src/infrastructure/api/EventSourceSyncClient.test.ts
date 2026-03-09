import { EventSourceSyncClient, XhrFactory } from './EventSourceSyncClient'

type XhrEventMap = {
  readystatechange?: () => void
  error?: () => void
  abort?: () => void
}

class FakeXhr {
  readyState = 0
  responseText = ''
  status = 0
  withCredentials = false

  private _headers: Record<string, string> = {}
  private _listeners: XhrEventMap = {}
  private _url = ''
  private _method = ''

  open(method: string, url: string): void {
    this._method = method
    this._url = url
    this.readyState = 1
  }

  setRequestHeader(name: string, value: string): void {
    this._headers[name] = value
  }

  send(): void {
    this.readyState = 2
  }

  abort(): void {
    this.readyState = 0
    this._listeners.abort?.()
  }

  addEventListener(event: string, handler: () => void): void {
    this._listeners[event as keyof XhrEventMap] = handler
  }

  // Test helpers
  get url(): string {
    return this._url
  }

  get method(): string {
    return this._method
  }

  get headers(): Record<string, string> {
    return this._headers
  }

  simulateOpen(): void {
    this.readyState = 3
    this.status = 200
    this._listeners.readystatechange?.()
  }

  simulateChunk(chunk: string): void {
    this.responseText += chunk
    this._listeners.readystatechange?.()
  }

  simulateError(): void {
    this.readyState = 4
    this.status = 0
    this._listeners.error?.()
  }
}

function makeFakeXhrFactory(fakeXhr: FakeXhr): XhrFactory {
  return () => fakeXhr as unknown as XMLHttpRequest
}

describe('EventSourceSyncClient', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('builds correct SSE URL from server URL', () => {
    const fakeXhr = new FakeXhr()
    const onMessage = jest.fn()
    const client = new EventSourceSyncClient(
      'https://guidr.madebysteven.nl',
      'my-token',
      onMessage,
      undefined,
      makeFakeXhrFactory(fakeXhr),
    )

    client.connect()

    expect(fakeXhr.url).toBe('https://guidr.madebysteven.nl/api/v1/sse/sync')
    expect(fakeXhr.method).toBe('GET')

    client.disconnect()
  })

  it('includes device_id as query param when provided', () => {
    const fakeXhr = new FakeXhr()
    const onMessage = jest.fn()
    const client = new EventSourceSyncClient(
      'https://guidr.madebysteven.nl',
      'my-token',
      onMessage,
      'device-abc',
      makeFakeXhrFactory(fakeXhr),
    )

    client.connect()

    expect(fakeXhr.url).toBe('https://guidr.madebysteven.nl/api/v1/sse/sync?device_id=device-abc')

    client.disconnect()
  })

  it('sends Authorization Bearer header', () => {
    const fakeXhr = new FakeXhr()
    const onMessage = jest.fn()
    const client = new EventSourceSyncClient(
      'https://guidr.madebysteven.nl',
      'tok-123',
      onMessage,
      undefined,
      makeFakeXhrFactory(fakeXhr),
    )

    client.connect()

    expect(fakeXhr.headers['Authorization']).toBe('Bearer tok-123')

    client.disconnect()
  })

  it('strips trailing /api/v1 from server URL before appending path', () => {
    const fakeXhr = new FakeXhr()
    const onMessage = jest.fn()
    const client = new EventSourceSyncClient(
      'https://guidr.madebysteven.nl/api/v1',
      'tok',
      onMessage,
      undefined,
      makeFakeXhrFactory(fakeXhr),
    )

    client.connect()

    expect(fakeXhr.url).toBe('https://guidr.madebysteven.nl/api/v1/sse/sync')

    client.disconnect()
  })

  it('dispatches parsed SSE messages to onMessage handler', () => {
    const fakeXhr = new FakeXhr()
    const onMessage = jest.fn()
    const client = new EventSourceSyncClient(
      'https://guidr.madebysteven.nl',
      'tok',
      onMessage,
      undefined,
      makeFakeXhrFactory(fakeXhr),
    )

    client.connect()
    fakeXhr.simulateOpen()
    fakeXhr.simulateChunk(
      'event: timer.started\ndata: {"timerId":"t1","stepId":"s1"}\n\n',
    )

    expect(onMessage).toHaveBeenCalledWith({
      type: 'timer.started',
      payload: { timerId: 't1', stepId: 's1' },
    })

    client.disconnect()
  })

  it('skips keep-alive comment lines', () => {
    const fakeXhr = new FakeXhr()
    const onMessage = jest.fn()
    const client = new EventSourceSyncClient(
      'https://guidr.madebysteven.nl',
      'tok',
      onMessage,
      undefined,
      makeFakeXhrFactory(fakeXhr),
    )

    client.connect()
    fakeXhr.simulateOpen()
    fakeXhr.simulateChunk(': keep-alive\n\nevent: timer.started\ndata: {"timerId":"t2"}\n\n')

    expect(onMessage).toHaveBeenCalledTimes(1)
    expect(onMessage).toHaveBeenCalledWith({
      type: 'timer.started',
      payload: { timerId: 't2' },
    })

    client.disconnect()
  })

  it('passes through connected event to onMessage handler', () => {
    const fakeXhr = new FakeXhr()
    const onMessage = jest.fn()
    const client = new EventSourceSyncClient(
      'https://guidr.madebysteven.nl',
      'tok',
      onMessage,
      undefined,
      makeFakeXhrFactory(fakeXhr),
    )

    client.connect()
    fakeXhr.simulateOpen()
    fakeXhr.simulateChunk(
      'event: connected\ndata: {"status":"connected","userId":"u1"}\n\n',
    )

    expect(onMessage).toHaveBeenCalledWith({
      type: 'connected',
      payload: { status: 'connected', userId: 'u1' },
    })

    client.disconnect()
  })

  it('handles multi-chunk SSE messages correctly', () => {
    const fakeXhr = new FakeXhr()
    const onMessage = jest.fn()
    const client = new EventSourceSyncClient(
      'https://guidr.madebysteven.nl',
      'tok',
      onMessage,
      undefined,
      makeFakeXhrFactory(fakeXhr),
    )

    client.connect()
    fakeXhr.simulateOpen()
    // First chunk: partial message
    fakeXhr.simulateChunk('event: timer.started\n')
    expect(onMessage).not.toHaveBeenCalled()

    // Second chunk: completes the message
    fakeXhr.simulateChunk('data: {"timerId":"t3"}\n\n')
    expect(onMessage).toHaveBeenCalledWith({
      type: 'timer.started',
      payload: { timerId: 't3' },
    })

    client.disconnect()
  })

  it('reports isConnected false before connect', () => {
    const fakeXhr = new FakeXhr()
    const onMessage = jest.fn()
    const client = new EventSourceSyncClient(
      'https://guidr.madebysteven.nl',
      'tok',
      onMessage,
      undefined,
      makeFakeXhrFactory(fakeXhr),
    )

    expect(client.isConnected).toBe(false)
  })

  it('reports isConnected true after streaming response opens', () => {
    const fakeXhr = new FakeXhr()
    const onMessage = jest.fn()
    const client = new EventSourceSyncClient(
      'https://guidr.madebysteven.nl',
      'tok',
      onMessage,
      undefined,
      makeFakeXhrFactory(fakeXhr),
    )

    client.connect()
    fakeXhr.simulateOpen()

    expect(client.isConnected).toBe(true)

    client.disconnect()
  })

  it('reports isConnected false after disconnect', () => {
    const fakeXhr = new FakeXhr()
    const onMessage = jest.fn()
    const client = new EventSourceSyncClient(
      'https://guidr.madebysteven.nl',
      'tok',
      onMessage,
      undefined,
      makeFakeXhrFactory(fakeXhr),
    )

    client.connect()
    fakeXhr.simulateOpen()
    client.disconnect()

    expect(client.isConnected).toBe(false)
  })

  it('does not connect twice when already connected', () => {
    let xhrCount = 0
    const fakeXhr = new FakeXhr()
    const factory: XhrFactory = () => {
      xhrCount++
      return fakeXhr as unknown as XMLHttpRequest
    }
    const onMessage = jest.fn()
    const client = new EventSourceSyncClient(
      'https://guidr.madebysteven.nl',
      'tok',
      onMessage,
      undefined,
      factory,
    )

    client.connect()
    fakeXhr.simulateOpen()
    client.connect() // should be noop

    expect(xhrCount).toBe(1)

    client.disconnect()
  })

  it('schedules reconnect with exponential backoff after error', () => {
    const xhrs: FakeXhr[] = []
    const factory: XhrFactory = () => {
      const xhr = new FakeXhr()
      xhrs.push(xhr)
      return xhr as unknown as XMLHttpRequest
    }
    const onMessage = jest.fn()
    const client = new EventSourceSyncClient(
      'https://guidr.madebysteven.nl',
      'tok',
      onMessage,
      undefined,
      factory,
    )

    client.connect()
    expect(xhrs).toHaveLength(1)

    // Simulate error on first XHR
    xhrs[0]!.simulateError()

    // After 1s base delay, should reconnect
    jest.advanceTimersByTime(1_000)
    expect(xhrs).toHaveLength(2)

    client.disconnect()
  })

  it('does not reconnect after intentional disconnect', () => {
    const xhrs: FakeXhr[] = []
    const factory: XhrFactory = () => {
      const xhr = new FakeXhr()
      xhrs.push(xhr)
      return xhr as unknown as XMLHttpRequest
    }
    const onMessage = jest.fn()
    const client = new EventSourceSyncClient(
      'https://guidr.madebysteven.nl',
      'tok',
      onMessage,
      undefined,
      factory,
    )

    client.connect()
    xhrs[0]!.simulateError()
    client.disconnect() // cancel pending reconnect

    jest.advanceTimersByTime(60_000)
    expect(xhrs).toHaveLength(1)
  })

  it('stops reconnecting after max attempts', () => {
    const xhrs: FakeXhr[] = []
    const factory: XhrFactory = () => {
      const xhr = new FakeXhr()
      xhrs.push(xhr)
      return xhr as unknown as XMLHttpRequest
    }
    const onMessage = jest.fn()
    const client = new EventSourceSyncClient(
      'https://guidr.madebysteven.nl',
      'tok',
      onMessage,
      undefined,
      factory,
    )

    client.connect()

    // Simulate 10 errors — should only create 11 total (1 initial + 10 reconnects)
    for (let i = 0; i < 10; i++) {
      const xhr = xhrs[i]!
      xhr.simulateError()
      jest.advanceTimersByTime(30_000) // advance past max cap
    }

    // 11th error — no more reconnects
    xhrs[10]?.simulateError()
    jest.advanceTimersByTime(60_000)

    expect(xhrs).toHaveLength(11)

    client.disconnect()
  })

  it('resets reconnect attempts after successful connection', () => {
    const xhrs: FakeXhr[] = []
    const factory: XhrFactory = () => {
      const xhr = new FakeXhr()
      xhrs.push(xhr)
      return xhr as unknown as XMLHttpRequest
    }
    const onMessage = jest.fn()
    const client = new EventSourceSyncClient(
      'https://guidr.madebysteven.nl',
      'tok',
      onMessage,
      undefined,
      factory,
    )

    client.connect()
    xhrs[0]!.simulateError()
    jest.advanceTimersByTime(1_000)

    // Second XHR connects successfully
    xhrs[1]!.simulateOpen()

    // Now error again — should reconnect immediately with base delay again
    xhrs[1]!.simulateError()
    jest.advanceTimersByTime(1_000)

    expect(xhrs).toHaveLength(3)

    client.disconnect()
  })
})
