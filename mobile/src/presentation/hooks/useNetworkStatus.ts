import { useState, useEffect } from 'react'
import NetInfo from '@react-native-community/netinfo'

export interface NetworkStatus {
  isOnline: boolean
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // addEventListener fires immediately with current state AND on every change
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? true) // null = unknown → optimistic true
    })
    return unsubscribe
  }, [])

  return { isOnline }
}
