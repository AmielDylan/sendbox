/**
 * Hook personnalisé pour gérer les notifications en temps réel
 */

import { useState, useEffect } from 'react'
import { createClient } from "@/lib/shared/db/client"
import { toast } from 'sonner'
import { Notification } from "@/lib/shared/db/queries/notifications"

export function useNotifications(limit: number = 20) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    let channel: any = null
    let isActive = true

    const getChannelName = (userId: string) => {
      const suffix =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2)
      return `notifications:${userId}:${suffix}`
    }

    const loadNotifications = async () => {
      if (isActive) {
        setIsLoading(true)
      }

      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          if (isActive) {
            setIsLoading(false)
          }
          return
        }

        // Charger les notifications
        const { data: notificationsData, error: notificationsError } = await supabase
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

        const unread = (notificationsData || []).filter((n: any) => !n.read_at).length
        setUnreadCount(unread)

        // Souscrire aux notifications temps réel avec filtrage serveur
        // IMPORTANT: Le filtre doit correspondre exactement à ce que le serveur RLS permet
        channel = supabase
          .channel(getChannelName(user.id))
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              const newNotif = payload.new as Notification

              setNotifications((prev) => [newNotif, ...prev.slice(0, limit - 1)])
              setUnreadCount((prev) => prev + 1)

              // Afficher toast
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
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              const updatedNotif = payload.new as Notification

              setNotifications((prev) =>
                prev.map((n) => (n.id === updatedNotif.id ? updatedNotif : n))
              )

              setNotifications((current) => {
                const unread = current.filter((n) => !n.read_at).length
                setUnreadCount(unread)
                return current
              })
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('✅ Subscribed to notifications realtime')
            } else if (status === 'CHANNEL_ERROR') {
              console.error('❌ Realtime subscription error')
              toast.error('Erreur de connexion temps réel')
            } else if (status === 'TIMED_OUT') {
              console.error('⏱️ Realtime subscription timed out')
              toast.warning('Connexion temps réel lente')
            } else if (status === 'CLOSED') {
              console.log('🔌 Realtime channel closed')
            }
          })
      } catch (error) {
        console.error('Error loading notifications:', error)
        if (isActive) {
          toast.error('Erreur lors du chargement des notifications')
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
      if (channel) {
        supabase.removeChannel(channel)
        console.log('🧹 Unsubscribed from notifications channel')
      }
    }
  }, [limit])

  return { notifications, unreadCount, isLoading }
}
