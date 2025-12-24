/**
 * Server Actions pour les notifications
 */

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from "@/lib/shared/db/server"
import { sendEmail } from "@/lib/shared/services/email/client"

export type NotificationType =
  | 'booking_request'
  | 'booking_accepted'
  | 'booking_refused'
  | 'payment_confirmed'
  | 'deposit_reminder'
  | 'transit_started'
  | 'delivery_reminder'
  | 'rating_request'
  | 'admin_message'
  | 'system_alert'

interface NotifyUserParams {
  user_id: string
  type: NotificationType
  title: string
  content: string
  booking_id?: string
  announcement_id?: string
  sendEmail?: boolean
}

/**
 * Crée une notification pour un utilisateur
 */
export async function notifyUser(params: NotifyUserParams) {
  const supabase = await createClient()

  try {
    // Créer la notification dans la base de données
    const { data, error } = await (supabase.rpc as any)('create_notification', {
      p_user_id: params.user_id,
      p_type: params.type,
      p_title: params.title,
      p_content: params.content,
      p_booking_id: params.booking_id || null,
      p_announcement_id: params.announcement_id || null,
    })

    if (error) {
      console.error('Error creating notification:', error)
      return {
        error: 'Erreur lors de la création de la notification',
      }
    }

    // Envoyer email si demandé
    if (params.sendEmail) {
      try {
        // Récupérer l'email de l'utilisateur
        // Note: params.user_id est déjà l'ID du profil (qui correspond à auth.uid())
        const { data: authUser } = await supabase.auth.admin.getUserById(params.user_id)

        if (authUser?.user?.email) {
          await sendEmail({
            to: authUser.user.email,
            subject: params.title,
            template: 'notification',
            data: {
              title: params.title,
              content: params.content,
              type: params.type,
              booking_id: params.booking_id,
              announcement_id: params.announcement_id,
            },
          })
        }
      } catch (emailError) {
        // Ne pas bloquer si l'email échoue
        console.error('Error sending email:', emailError)
      }
    }

    revalidatePath('/dashboard/notifications')
    return {
      success: true,
      notificationId: data,
    }
  } catch (error) {
    console.error('Error notifying user:', error)
    return {
      error: 'Une erreur est survenue',
    }
  }
}

/**
 * Marque toutes les notifications comme lues
 */
export async function markAllNotificationsAsRead() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      error: 'Non authentifié',
    }
  }

  try {
    const { error } = await supabase
      .from('notifications')
      .update({
        read_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .is('read_at', null)

    if (error) {
      console.error('Error marking notifications as read:', error)
      return {
        error: 'Erreur lors de la mise à jour',
      }
    }

    revalidatePath('/dashboard/notifications')
    return {
      success: true,
    }
  } catch (error) {
    console.error('Error marking notifications as read:', error)
    return {
      error: 'Une erreur est survenue',
    }
  }
}

/**
 * Récupère les notifications avec filtres et pagination
 */
export async function getNotifications(
  type?: NotificationType,
  page: number = 1,
  limit: number = 20
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      error: 'Non authentifié',
    }
  }

  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (type) {
      query = query.eq('type', type)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching notifications:', error)
      return {
        error: 'Erreur lors de la récupération des notifications',
      }
    }

    // Compter le total
    let countQuery = supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (type) {
      countQuery = countQuery.eq('type', type)
    }

    const { count } = await countQuery

    return {
      notifications: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    }
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return {
      error: 'Une erreur est survenue',
    }
  }
}




