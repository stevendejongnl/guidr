export type XhrFactory = () => XMLHttpRequest

type SyncMessage = { type: string; payload: Record<string, unknown> }
type MessageHandler = (message: SyncMessage) => void

const MAX_RECONNECT_ATTEMPTS = 10
const BASE_RECONNECT_MS = 1_000
const MAX_RECONNECT_MS = 30_000

const defaultXhrFactory: XhrFactory = () => new XMLHttpRequest()

export class EventSourceSyncClient {
  private xhr: XMLHttpRequest | null = null
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  private reconnectAttempts = 0
  private connected = false
  private intentionalClose = false

  private readonly serverUrl: string
  private readonly authToken: string
  private readonly onMessage: MessageHandler
  private readonly deviceId: string | undefined
  private readonly xhrFactory: XhrFactory

  // SSE streaming state
  private processedLength = 0
  private pendingEventType = ''
  private pendingData = ''

  constructor(
    serverUrl: string,
    authToken: string,
    onMessage: MessageHandler,
    deviceId?: string,
    xhrFactory: XhrFactory = defaultXhrFactory,
  ) {
    this.serverUrl = serverUrl
    this.authToken = authToken
    this.onMessage = onMessage
    this.deviceId = deviceId
    this.xhrFactory = xhrFactory
  }

  connect(): void {
    if (this.xhr !== null) {
      return
    }

    this.intentionalClose = false
    this.processedLength = 0
    this.pendingEventType = ''
    this.pendingData = ''

    const base = this.serverUrl.replace(/\/api\/v1\/?$/, '')
    let url = `${base}/api/v1/sse/sync`
    if (this.deviceId) {
      url += `?device_id=${encodeURIComponent(this.deviceId)}`
    }

    const xhr = this.xhrFactory()
    this.xhr = xhr

    xhr.open('GET', url)
    xhr.setRequestHeader('Authorization', `Bearer ${this.authToken}`)
    xhr.setRequestHeader('Accept', 'text/event-stream')
    xhr.setRequestHeader('Cache-Control', 'no-cache')

    xhr.addEventListener('readystatechange', () => {
      if (xhr.readyState === 3 || xhr.readyState === 4) {
        if (xhr.status === 200 && !this.connected) {
          this.connected = true
          this.reconnectAttempts = 0
        }
        this.processNewChunks(xhr.responseText)
      }

      if (xhr.readyState === 4 && !this.intentionalClose) {
        this.cleanupXhr()
        this.scheduleReconnect()
      }
    })

    xhr.addEventListener('error', () => {
      if (!this.intentionalClose) {
        this.cleanupXhr()
        this.scheduleReconnect()
      }
    })

    xhr.addEventListener('abort', () => {
      // intentional — do nothing
    })

    xhr.send()
  }

  disconnect(): void {
    this.intentionalClose = true
    this.cleanupXhr()
    if (this.reconnectTimeout !== null) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    this.reconnectAttempts = 0
  }

  get isConnected(): boolean {
    return this.connected
  }

  private cleanupXhr(): void {
    this.connected = false
    if (this.xhr !== null) {
      this.xhr.abort()
      this.xhr = null
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      return
    }
    const delay = Math.min(
      BASE_RECONNECT_MS * Math.pow(2, this.reconnectAttempts),
      MAX_RECONNECT_MS,
    )
    this.reconnectAttempts++
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null
      if (!this.intentionalClose) {
        this.connect()
      }
    }, delay)
  }

  private processNewChunks(responseText: string): void {
    const newText = responseText.slice(this.processedLength)
    if (newText.length === 0) {
      return
    }
    this.processedLength = responseText.length

    const lines = newText.split('\n')

    for (const line of lines) {
      if (line.startsWith(':')) {
        // SSE comment (keep-alive) — skip
        continue
      }

      if (line === '') {
        // Blank line: dispatch buffered event only if we have data
        if (this.pendingData !== '') {
          const eventType = this.pendingEventType !== '' ? this.pendingEventType : 'message'
          try {
            const payload = JSON.parse(this.pendingData) as Record<string, unknown>
            this.onMessage({ type: eventType, payload })
          } catch {
            // Ignore malformed JSON
          }
          // Only reset after a real dispatch
          this.pendingEventType = ''
          this.pendingData = ''
        }
        continue
      }

      if (line.startsWith('event:')) {
        this.pendingEventType = line.slice('event:'.length).trim()
      } else if (line.startsWith('data:')) {
        const value = line.slice('data:'.length).trim()
        this.pendingData = this.pendingData !== '' ? `${this.pendingData}\n${value}` : value
      }
    }
  }
}
