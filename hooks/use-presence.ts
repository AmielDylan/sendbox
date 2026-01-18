/**
 * Hook personnalisé pour gérer la présence en temps réel avec Supabase Realtime
 * Gère le statut en ligne/hors ligne et les indicateurs de frappe
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from "@/lib/shared/db/client"
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface PresenceState {
  [userId: string]: {
    user_id: string
    online_at: string
    typing?: boolean
    typing_at?: string
  }[]
}

export interface UserPresence {
  user_id: string
  online_at: string
  typing?: boolean
  typing_at?: string
}

export function usePresence(channelName: string, userId: string | null) {
  const [presenceState, setPresenceState] = useState<PresenceState>({})
  const [isTyping, setIsTyping] = useState<{ [userId: string]: boolean }>({})
  const channelRef = useRef<RealtimeChannel | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Fonction pour vérifier si un utilisateur est en ligne
  const isUserOnline = useCallback(
    (targetUserId: string): boolean => {
      const userPresences = presenceState[targetUserId]
      if (!userPresences || userPresences.length === 0) return false

      // Vérifier si au moins une présence est récente (< 30 secondes)
      const now = Date.now()
      return userPresences.some((presence) => {
        const onlineAt = new Date(presence.online_at).getTime()
        return now - onlineAt < 30000 // 30 secondes
      })
    },
    [presenceState]
  )

  // Fonction pour vérifier si un utilisateur est en train d'écrire
  const isUserTyping = useCallback(
    (targetUserId: string): boolean => {
      return isTyping[targetUserId] || false
    },
    [isTyping]
  )

  // Fonction pour envoyer le statut "en train d'écrire"
  const sendTypingStatus = useCallback(() => {
    if (!channelRef.current || !userId) return

    // Envoyer via broadcast (événement temporaire)
    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        user_id: userId,
        typing: true,
        typing_at: new Date().toISOString(),
      },
    })

    // Annuler le timeout précédent
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Arrêter automatiquement le statut "typing" après 3 secondes
    typingTimeoutRef.current = setTimeout(() => {
      if (channelRef.current && userId) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            user_id: userId,
            typing: false,
            typing_at: new Date().toISOString(),
          },
        })
      }
    }, 3000)
  }, [userId])

  // Fonction pour arrêter le statut "en train d'écrire"
  const stopTyping = useCallback(() => {
    if (!channelRef.current || !userId) return

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }

    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        user_id: userId,
        typing: false,
        typing_at: new Date().toISOString(),
      },
    })
  }, [userId])

  useEffect(() => {
    if (!userId || !channelName) return

    const supabase = createClient()

    // Cleanup du channel précédent
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    // Créer un nouveau channel avec presence activé
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: userId, // Utiliser userId comme clé unique
        },
        broadcast: {
          self: false, // Ne pas recevoir ses propres broadcasts
        },
      },
    })

    // Écouter les événements de synchronisation de présence
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        setPresenceState(state as unknown as PresenceState)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('[Presence] User joined:', key, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('[Presence] User left:', key, leftPresences)
      })
      // Écouter les événements de typing via broadcast
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.user_id && payload.user_id !== userId) {
          setIsTyping((prev) => ({
            ...prev,
            [payload.user_id]: payload.typing || false,
          }))

          // Auto-nettoyer le statut typing après 5 secondes
          if (payload.typing) {
            setTimeout(() => {
              setIsTyping((prev) => ({
                ...prev,
                [payload.user_id]: false,
              }))
            }, 5000)
          }
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Envoyer notre présence initiale
          await channel.track({
            user_id: userId,
            online_at: new Date().toISOString(),
            typing: false,
          })

          // Mettre à jour la présence toutes les 20 secondes (heartbeat)
          const heartbeatInterval = setInterval(async () => {
            if (channelRef.current) {
              await channel.track({
                user_id: userId,
                online_at: new Date().toISOString(),
                typing: false,
              })
            }
          }, 20000)

          // Cleanup du heartbeat
          return () => {
            clearInterval(heartbeatInterval)
          }
        }
      })

    channelRef.current = channel

    // Cleanup
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [channelName, userId])

  return {
    presenceState,
    isUserOnline,
    isUserTyping,
    sendTypingStatus,
    stopTyping,
  }
}
