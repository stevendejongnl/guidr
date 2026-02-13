type MessageHandler = (message: { type: string; payload?: Record<string, unknown> }) => void

const PING_INTERVAL_MS = 25_000
const MAX_RECONNECT_ATTEMPTS = 10
const BASE_RECONNECT_MS = 1_000
const MAX_RECONNECT_MS = 30_000

export class WebSocketSyncClient {
  private ws: WebSocket | null = null
  private pingInterval: ReturnType<typeof setInterval> | null = null
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  private reconnectAttempts = 0
  private serverUrl: string
  private authToken: string
  private deviceId: string | undefined
  private onMessage: MessageHandler
  private intentionalClose = false

  constructor(
    serverUrl: string,
    authToken: string,
    onMessage: MessageHandler,
    deviceId?: string,
  ) {
    this.serverUrl = serverUrl
    this.authToken = authToken
    this.onMessage = onMessage
    this.deviceId = deviceId
  }

  connect(): void {
    if (this.ws) {
      return
    }

    this.intentionalClose = false
    const baseUrl = this.serverUrl.replace(/\/api\/v1\/?$/, '').replace(/^http/, 'ws')
    let url = `${baseUrl}/api/v1/ws/sync?token=${encodeURIComponent(this.authToken)}`
    if (this.deviceId) {
      url += `&device_id=${encodeURIComponent(this.deviceId)}`
    }

    this.ws = new WebSocket(url)

    this.ws.onopen = () => {
      this.reconnectAttempts = 0
      this.startPing()
    }

    this.ws.onmessage = (event: WebSocketMessageEvent) => {
      try {
        const data = JSON.parse(event.data as string)
        if (data.type === 'pong') return
        this.onMessage(data)
      } catch {
        // Ignore malformed messages
      }
    }

    this.ws.onclose = () => {
      this.cleanup()
      if (!this.intentionalClose) {
        this.scheduleReconnect()
      }
    }

    this.ws.onerror = () => {
      // onclose will be called after onerror
    }
  }

  disconnect(): void {
    this.intentionalClose = true
    this.cleanup()
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    this.reconnectAttempts = 0
  }

  get isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }

  private startPing(): void {
    this.stopPing()
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }))
      }
    }, PING_INTERVAL_MS)
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }

  private cleanup(): void {
    this.stopPing()
    if (this.ws) {
      this.ws.onopen = null
      this.ws.onmessage = null
      this.ws.onclose = null
      this.ws.onerror = null
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close()
      }
      this.ws = null
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
      this.connect()
    }, delay)
  }
}
