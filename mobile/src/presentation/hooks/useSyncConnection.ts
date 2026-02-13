import { useEffect, useRef, useCallback } from 'react'
import { AppState } from 'react-native'
import { WebSocketSyncClient } from '../../infrastructure/api/WebSocketSyncClient'
import { SyncEventEmitter } from '../../common/SyncEventEmitter'

export interface UseSyncConnectionOptions {
  serverUrl: string | null
  authToken: string | null
  onReconnect?: () => void
}

export function useSyncConnection({
  serverUrl,
  authToken,
  onReconnect,
}: UseSyncConnectionOptions): void {
  const clientRef = useRef<WebSocketSyncClient | null>(null)
  const onReconnectRef = useRef(onReconnect)

  useEffect(() => {
    onReconnectRef.current = onReconnect
  }, [onReconnect])

  const handleMessage = useCallback(
    (message: { type: string; payload?: Record<string, unknown> }) => {
      if (message.type === 'welcome') return
      SyncEventEmitter.emit(message.type, message.payload ?? {})
    },
    [],
  )

  // Connect / disconnect based on credentials
  useEffect(() => {
    if (!serverUrl || !authToken) {
      return
    }

    const client = new WebSocketSyncClient(serverUrl, authToken, handleMessage)
    clientRef.current = client
    client.connect()

    return () => {
      client.disconnect()
      clientRef.current = null
    }
  }, [serverUrl, authToken, handleMessage])

  // Reconnect on app foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: string) => {
      if (nextState === 'active' && clientRef.current) {
        if (!clientRef.current.isConnected) {
          clientRef.current.connect()
          onReconnectRef.current?.()
        }
      }
    })

    return () => {
      subscription.remove()
    }
  }, [])
}
