/**
 * Hook personnalisé pour gérer les notifications en temps réel
 */

import { useState, useEffect } from 'react'
import { createClient } from "@/lib/shared/db/client"
import { toast } from 'sonner'
import Link from 'next/link'
import { Notification } from "@/lib/shared/db/queries/notifications"

export function useNotifications(limit: number = 20) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    // Charger les notifications
    const loadNotifications = async () => {
      setIsLoading(true)

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setIsLoading(false)
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
          return
        }

        setNotifications((notificationsData as unknown as Notification[]) || [])

        // Compter les non lues
        const unread = (notificationsData || []).filter((n) => !n.read_at).length
        setUnreadCount(unread)
      } catch (error) {
        console.error('Error loading notifications:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadNotifications()

    // S'abonner aux nouvelles notifications en temps réel
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        async (payload) => {
          const {
            data: { user },
          } = await supabase.auth.getUser()

          if (!user) return

          // Vérifier que la notification est pour cet utilisateur
          const newNotif = payload.new as Notification
          if (newNotif.user_id !== user.id) return

          // Ajouter la nouvelle notification en haut de la liste
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
        },
        (payload) => {
          // Mettre à jour la notification si modifiée (ex: marquée comme lue)
          setNotifications((prev) =>
            prev.map((n) => (n.id === payload.new.id ? (payload.new as Notification) : n))
          )

          // Recompter les non lues
          setNotifications((current) => {
            const unread = current.filter((n) => !n.read_at).length
            setUnreadCount(unread)
            return current
          })
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [limit])

  return { notifications, unreadCount, isLoading }
}

