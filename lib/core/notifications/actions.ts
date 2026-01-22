/**
 * Server Actions pour les notifications
 */

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from "@/lib/shared/db/server"
import { createAdminClient } from "@/lib/shared/db/admin"
import { sendEmail } from "@/lib/shared/services/email/client"

export type NotificationType =
  | 'booking_request'
  | 'booking_accepted'
  | 'booking_refused'
  | 'payment_confirmed'
  | 'deposit_reminder'
  | 'transit_started'
  | 'delivery_reminder'
  | 'delivery_confirmed'
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
  let notificationId: string | null = null
  let notificationError: unknown = null

  try {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const adminClient = createAdminClient()
        const { data: insertedNotification, error: insertError } = await adminClient
          .from('notifications')
          .insert({
            user_id: params.user_id,
            type: params.type,
            title: params.title,
            content: params.content,
            booking_id: params.booking_id || null,
            announcement_id: params.announcement_id || null,
          })
          .select('id')
          .single()

        if (insertError) {
          notificationError = insertError
          console.error('Error inserting notification (admin):', insertError)
        } else {
          notificationId = insertedNotification?.id || null
          notificationError = null
        }
      } catch (adminInsertError) {
        notificationError = adminInsertError
        console.warn('Admin notification insert failed:', adminInsertError)
      }
    }

    if (!notificationId) {
      const { data, error } = await (supabase.rpc as any)('create_notification', {
        p_user_id: params.user_id,
        p_type: params.type,
        p_title: params.title,
        p_content: params.content,
        p_booking_id: params.booking_id || null,
        p_announcement_id: params.announcement_id || null,
      })

      if (error) {
        notificationError = error
        console.error('Error creating notification:', error)
      } else {
        notificationId = data || null
        notificationError = null
      }
    }

    // Envoyer email si demandé
    if (params.sendEmail) {
      try {
        let recipientEmail: string | null = null

        if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
          try {
            const adminClient = createAdminClient()
            const { data: authUser, error: adminError } = await adminClient.auth.admin.getUserById(
              params.user_id
            )
            if (adminError) {
              console.warn('Admin email lookup failed:', adminError)
            } else {
              recipientEmail = authUser?.user?.email || null
            }
          } catch (adminClientError) {
            console.warn('Admin client not available:', adminClientError)
          }
        }

        if (!recipientEmail) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', params.user_id)
            .single()

          if (profileError) {
            console.warn('Profile email lookup failed:', profileError)
          } else {
            recipientEmail = profileData?.email || null
          }
        }

        if (recipientEmail) {
          let emailData: Record<string, any> = {
            title: params.title,
            content: params.content,
            type: params.type,
            booking_id: params.booking_id,
            announcement_id: params.announcement_id,
          }

          // Enrichir les données pour booking_request
          if (params.type === 'booking_request' && params.booking_id) {
            const { data: bookingData } = await supabase
              .from('bookings')
              .select(`
                kilos_requested,
                total_price,
                package_description,
                announcements:announcement_id (
                  departure_city,
                  arrival_city
                )
              `)
              .eq('id', params.booking_id)
              .single()

            if (bookingData) {
              emailData = {
                ...emailData,
                // Variables en MAJUSCULES pour les templates Resend
                KILOS_REQUESTED: bookingData.kilos_requested,
                TOTAL_PRICE: bookingData.total_price?.toFixed(2) || '0.00',
                PACKAGE_DESCRIPTION: bookingData.package_description || 'Non précisée',
                DEPARTURE_CITY: (bookingData.announcements as any)?.departure_city || 'Ville de départ',
                ARRIVAL_CITY: (bookingData.announcements as any)?.arrival_city || 'Ville d’arrivée',
                BOOKING_ID: params.booking_id || 'inconnu',
                APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
              }
            }
          }

          await sendEmail({
            to: recipientEmail,
            subject: params.title,
            template: params.type === 'booking_request' ? 'booking_request' : 'notification',
            data: emailData,
            useResendTemplate: true, // Utilise les templates Resend pour booking_request
          })
        } else {
          console.warn('No recipient email found for user:', params.user_id)
        }
      } catch (emailError) {
        // Ne pas bloquer si l'email échoue
        console.error('Error sending email:', emailError)
      }
    }

    revalidatePath('/dashboard/notifications')
    if (notificationError) {
      return {
        error: 'Erreur lors de la création de la notification',
      }
    }
    return {
      success: true,
      notificationId,
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
