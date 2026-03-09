import { useEffect, useRef, useCallback } from 'react'
import { AppState } from 'react-native'
import { EventSourceSyncClient } from '../../infrastructure/api/EventSourceSyncClient'
import { SyncEventEmitter } from '../../common/SyncEventEmitter'

export interface ISyncClient {
  connect(): void
  disconnect(): void
  readonly isConnected: boolean
}

type MessageHandler = (message: { type: string; payload?: Record<string, unknown> }) => void

export type SyncClientFactory = (
  serverUrl: string,
  authToken: string,
  onMessage: MessageHandler,
) => ISyncClient

const defaultClientFactory: SyncClientFactory = (serverUrl, authToken, onMessage) =>
  new EventSourceSyncClient(serverUrl, authToken, onMessage)

export interface UseSyncConnectionOptions {
  serverUrl: string | null
  authToken: string | null
  onReconnect?: () => void
  clientFactory?: SyncClientFactory
}

export function useSyncConnection({
  serverUrl,
  authToken,
  onReconnect,
  clientFactory = defaultClientFactory,
}: UseSyncConnectionOptions): void {
  const clientRef = useRef<ISyncClient | null>(null)
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

    const client = clientFactory(serverUrl, authToken, handleMessage)
    clientRef.current = client
    client.connect()

    return () => {
      client.disconnect()
      clientRef.current = null
    }
  }, [serverUrl, authToken, handleMessage, clientFactory])

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
