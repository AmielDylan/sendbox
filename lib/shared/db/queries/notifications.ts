/**
 * Queries pour les notifications
 */

import { createClient } from '@/lib/shared/db/client'

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  content: string
  booking_id: string | null
  announcement_id: string | null
  read_at: string | null
  created_at: string
}

/**
 * Récupère les notifications de l'utilisateur
 */
export async function getUserNotifications(limit: number = 50) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'Non authentifié' }
  }

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    return { data: null, error }
  }

  return { data: (data || []) as unknown as Notification[], error: null }
}

/**
 * Récupère le nombre de notifications non lues
 */
export async function getUnreadNotificationsCount() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { count: 0 }
  }

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('read_at', null)

  if (error) {
    return { count: 0 }
  }

  return { count: count || 0 }
}
