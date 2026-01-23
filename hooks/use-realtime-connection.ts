/**
 * Hook pour surveiller l'état de la connexion Realtime Supabase
 * et gérer les reconnexions automatiques
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from "@/lib/shared/db/client"

export type ConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error'

export function useRealtimeConnection() {
  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const [lastConnectedAt, setLastConnectedAt] = useState<Date | null>(null)
  const reconnectRef = useRef<(() => Promise<void>) | null>(null)

  const checkConnection = useCallback(async () => {
    try {
      const supabase = createClient()

      // Vérifier l'état de la session
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error || !session) {
        setStatus('disconnected')
        return false
      }

      // Créer un channel de test pour vérifier la connexion
      const testChannel = supabase.channel('connection-test', {
        config: {
          broadcast: { self: true },
        },
      })

      return new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => {
          supabase.removeChannel(testChannel)
          setStatus('error')
          resolve(false)
        }, 5000)

        testChannel
          .subscribe((status) => {
            clearTimeout(timeout)

            if (status === 'SUBSCRIBED') {
              setStatus('connected')
              setLastConnectedAt(new Date())
              setReconnectAttempts(0)
              supabase.removeChannel(testChannel)
              resolve(true)
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              setStatus('error')
              supabase.removeChannel(testChannel)
              resolve(false)
            }
          })
      })
    } catch (error) {
      console.error('[RealtimeConnection] Error checking connection:', error)
      setStatus('error')
      return false
    }
  }, [])

  const reconnect = useCallback(async () => {
    setStatus('connecting')
    setReconnectAttempts((prev) => prev + 1)

    const connected = await checkConnection()

    if (!connected && reconnectAttempts < 5) {
      // Backoff exponentiel: 1s, 2s, 4s, 8s, 16s
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 16000)

      setTimeout(() => {
        reconnectRef.current?.()
      }, delay)
    }
  }, [checkConnection, reconnectAttempts])

  useEffect(() => {
    reconnectRef.current = reconnect
  }, [reconnect])

  // Vérifier la connexion au montage
  useEffect(() => {
    checkConnection()
  }, [checkConnection])

  // Surveiller les changements de visibilité de la page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Revérifier la connexion quand l'utilisateur revient sur la page
        checkConnection()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [checkConnection])

  // Surveiller les événements online/offline
  useEffect(() => {
    const handleOnline = () => {
      console.log('[RealtimeConnection] Network back online, reconnecting...')
      reconnect()
    }

    const handleOffline = () => {
      console.log('[RealtimeConnection] Network offline')
      setStatus('disconnected')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [reconnect])

  return {
    status,
    isConnected: status === 'connected',
    isConnecting: status === 'connecting',
    isDisconnected: status === 'disconnected',
    isError: status === 'error',
    reconnectAttempts,
    lastConnectedAt,
    reconnect,
    checkConnection,
  }
}
