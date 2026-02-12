/**
 * Hook personnalisé pour gérer les notifications en temps réel
 */

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/shared/db/client'
import { toast } from 'sonner'
import { Notification } from '@/lib/shared/db/queries/notifications'

export function useNotifications(limit: number = 20) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => {
      const removed = prev.find(n => n.id === notificationId)
      if (removed && !removed.read_at) {
        setUnreadCount(count => Math.max(0, count - 1))
      }
      return prev.filter(n => n.id !== notificationId)
    })
  }, [])

  useEffect(() => {
    const supabase = createClient()
    let channel: any = null
    let isActive = true
    let retryTimeout: ReturnType<typeof setTimeout> | null = null
    let retryAttempts = 0
    const isProd = process.env.NODE_ENV === 'production'

    const getChannelName = (userId: string) => {
      const suffix =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2)
      return `notifications:${userId}:${suffix}`
    }

    const scheduleRetry = (reason: string, userId: string) => {
      if (!isActive) return
      retryAttempts += 1
      const delay = Math.min(1000 * Math.pow(2, retryAttempts - 1), 30000)

      if (!isProd) {
        console.warn(`[Realtime] Retrying notifications channel (${reason})`)
      }

      if (retryTimeout) {
        clearTimeout(retryTimeout)
      }

      retryTimeout = setTimeout(() => {
        if (!isActive) return
        subscribeToNotificationsChannel(userId).catch(() => null)
      }, delay)
    }

    const subscribeToNotificationsChannel = async (userId: string) => {
      if (!isActive) return

      if (channel) {
        supabase.removeChannel(channel)
        channel = null
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        scheduleRetry('missing_session', userId)
        return
      }

      await supabase.realtime.setAuth(session.access_token)

      channel = supabase
        .channel(getChannelName(userId))
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          payload => {
            const newNotif = payload.new as Notification

            setNotifications(prev => [newNotif, ...prev.slice(0, limit - 1)])
            setUnreadCount(prev => prev + 1)

            toast.info(newNotif.title, {
              description: newNotif.content,
              action: newNotif.booking_id
                ? {
                    label: 'Voir',
                    onClick: () => {
                      window.location.href = `/dashboard/colis/${newNotif.booking_id}`
                    },
                  }
                : undefined,
              duration: 5000,
            })
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          payload => {
            const updatedNotif = payload.new as Notification

            setNotifications(prev =>
              prev.map(n => (n.id === updatedNotif.id ? updatedNotif : n))
            )

            setNotifications(current => {
              const unread = current.filter(n => !n.read_at).length
              setUnreadCount(unread)
              return current
            })
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          payload => {
            const removedNotif = payload.old as Notification
            setNotifications(prev =>
              prev.filter(n => n.id !== removedNotif.id)
            )
            if (!removedNotif.read_at) {
              setUnreadCount(prev => Math.max(0, prev - 1))
            }
          }
        )
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            retryAttempts = 0
            console.log('✅ Subscribed to notifications realtime')
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Realtime subscription error', err)
            if (!isProd) {
              toast.error('Erreur de connexion temps réel')
            }
            scheduleRetry('channel_error', userId)
          } else if (status === 'TIMED_OUT') {
            console.error('⏱️ Realtime subscription timed out', err)
            if (!isProd) {
              toast.warning('Connexion temps réel lente')
            }
            scheduleRetry('timed_out', userId)
          } else if (status === 'CLOSED') {
            console.log('🔌 Realtime channel closed')
          }
        })
    }

    const loadNotifications = async () => {
      if (isActive) {
        setIsLoading(true)
      }

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        const user = session?.user

        if (!user) {
          if (isActive) {
            setIsLoading(false)
          }
          return
        }

        // Charger les notifications
        const { data: notificationsData, error: notificationsError } =
          await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (notificationsError) {
          console.error('Error loading notifications:', notificationsError)
          if (isActive) {
            setIsLoading(false)
          }
          return
        }

        if (!isActive) {
          return
        }

        setNotifications((notificationsData as unknown as Notification[]) || [])

        const unread = (notificationsData || []).filter(
          (n: any) => !n.read_at
        ).length
        setUnreadCount(unread)

        // Souscrire aux notifications temps réel avec filtrage serveur
        // IMPORTANT: Le filtre doit correspondre exactement à ce que le serveur RLS permet
        await subscribeToNotificationsChannel(user.id)
      } catch (error) {
        console.error('Error loading notifications:', error)
        if (isActive) {
          if (!isProd) {
            toast.error('Erreur lors du chargement des notifications')
          }
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    loadNotifications()

    return () => {
      isActive = false
      if (retryTimeout) {
        clearTimeout(retryTimeout)
        retryTimeout = null
      }
      if (channel) {
        supabase.removeChannel(channel)
        console.log('🧹 Unsubscribed from notifications channel')
      }
    }
  }, [limit])

  return { notifications, unreadCount, isLoading, removeNotification }
}
