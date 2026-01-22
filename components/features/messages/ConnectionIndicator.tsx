/**
 * Indicateur visuel de l'état de connexion temps réel
 */

'use client'

import { useRealtimeConnection } from '@/hooks/use-realtime-connection'
import { Button } from '@/components/ui/button'
import { IconWifi, IconWifiOff, IconRefresh } from '@tabler/icons-react'
import { cn } from '@/lib/utils'

interface ConnectionIndicatorProps {
  className?: string
  showText?: boolean
}

export function ConnectionIndicator({
  className,
  showText = true,
}: ConnectionIndicatorProps) {
  const {
    isConnected,
    isConnecting,
    isDisconnected,
    isError,
    reconnectAttempts,
    reconnect,
  } = useRealtimeConnection()

  // Ne rien afficher si tout va bien
  if (isConnected && reconnectAttempts === 0) {
    return null
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-md text-sm',
        isConnected && 'bg-green-500/10 text-green-700 dark:text-green-400',
        isConnecting && 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
        (isDisconnected || isError) && 'bg-red-500/10 text-red-700 dark:text-red-400',
        className
      )}
      role="status"
      aria-live="polite"
    >
      {isConnected && (
        <>
          <IconWifi className="h-4 w-4" />
          {showText && <span>Reconnecté</span>}
        </>
      )}

      {isConnecting && (
        <>
          <IconRefresh className="h-4 w-4 animate-spin" />
          {showText && (
            <span>
              Connexion en cours
              {reconnectAttempts > 0 && ` (tentative ${reconnectAttempts})`}
            </span>
          )}
        </>
      )}

      {(isDisconnected || isError) && (
        <>
          <IconWifiOff className="h-4 w-4" />
          {showText && <span>Connexion perdue</span>}
          <Button
            variant="ghost"
            size="sm"
            onClick={reconnect}
            className="h-6 px-2 ml-2"
          >
            Reconnecter
          </Button>
        </>
      )}
    </div>
  )
}
