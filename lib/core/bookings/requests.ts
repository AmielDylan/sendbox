/**
 * Server Actions pour la gestion des demandes de réservation (côté voyageur)
 */

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/shared/db/server'
import {
  getPublicProfiles,
  mapPublicProfilesById,
} from '@/lib/shared/db/queries/public-profiles'
import { createSystemNotification } from '@/lib/core/notifications/system'
import { isFeatureEnabled } from '@/lib/shared/config/features'

/**
 * Accepte une demande de réservation
 */
export async function acceptBooking(bookingId: string) {
  const supabase = await createClient()

  // Vérifier l'authentification
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      error: 'Vous devez être connecté',
    }
  }

  // Récupérer le booking avec l'annonce
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select(
      `
      *,
      announcements:announcement_id (
        id,
        traveler_id,
        available_kg,
        status
      )
    `
    )
    .eq('id', bookingId)
    .single()

  if (bookingError || !booking) {
    return {
      error: 'Demande introuvable',
    }
  }

  const announcement = booking.announcements as any

  // Vérifier que l'utilisateur est le voyageur
  if (announcement.traveler_id !== user.id) {
    return {
      error: "Vous n'êtes pas autorisé à accepter cette demande",
    }
  }

  if (isFeatureEnabled('KYC_ENABLED')) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('kyc_status, kyc_rejection_reason')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return {
        error: 'Profil introuvable',
      }
    }

    if (profile.kyc_status !== 'approved') {
      let errorMessage = "Vérification d'identité requise pour continuer"
      let errorDetails =
        "Veuillez compléter votre vérification d'identité pour accepter cette demande."

      if (profile.kyc_status === 'pending') {
        errorMessage = 'Vérification en cours'
        errorDetails =
          "Votre vérification d'identité est en cours d'examen. Vous pourrez accepter les demandes une fois celle-ci approuvée (24-48h)."
      } else if (profile.kyc_status === 'rejected') {
        errorMessage = 'Vérification refusée'
        errorDetails = profile.kyc_rejection_reason
          ? `Votre vérification a été refusée : ${profile.kyc_rejection_reason}. Veuillez soumettre de nouveaux documents.`
          : 'Votre vérification a été refusée. Veuillez soumettre de nouveaux documents depuis vos réglages.'
      } else if (profile.kyc_status === 'incomplete') {
        errorMessage = "Vérification d'identité incomplète"
        errorDetails =
          "Veuillez soumettre vos documents d'identité pour accepter cette demande."
      }

      return {
        error: errorMessage,
        errorDetails,
        field: 'kyc',
      }
    }
  }

  // Vérifier que le booking est en attente
  if (booking.status !== 'pending') {
    return {
      error: "Cette demande n'est plus en attente",
    }
  }

  // Vérifier que l'annonce est toujours active
  if (announcement.status !== 'active') {
    return {
      error: "Cette annonce n'est plus disponible",
    }
  }

  // Calculer le poids réservé actuel (y compris les autres bookings confirmés)
  const { data: existingBookings } = await supabase
    .from('bookings')
    .select('id, kilos_requested, weight_kg')
    .eq('announcement_id', announcement.id)
    .neq('id', bookingId)
    .in('status', ['accepted', 'paid', 'deposited', 'in_transit', 'delivered'])

  const reservedWeight =
    existingBookings?.reduce(
      (sum: number, b: any) => sum + (b.kilos_requested || b.weight_kg || 0),
      0
    ) || 0
  const availableWeight = Math.max(
    0,
    (announcement.available_kg || 0) - reservedWeight
  )
  const requestedWeight = booking.kilos_requested || 0
  const epsilon = 0.0001

  // Vérifier la capacité disponible (autoriser les égalités exactes)
  if (requestedWeight - availableWeight > epsilon) {
    return {
      error: `Capacité insuffisante. Il reste ${availableWeight.toFixed(1)} kg disponible(s).`,
    }
  }

  try {
    // Mettre à jour le booking
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', bookingId)

    if (updateError) {
      console.error('Error accepting booking:', updateError)
      return {
        error: "Erreur lors de l'acceptation de la demande",
      }
    }

    // Créer notification pour l'expéditeur (non-bloquant)
    const { error: notifError } = await createSystemNotification({
      userId: booking.sender_id,
      type: 'booking_accepted',
      title: 'Demande acceptée',
      content:
        'Votre demande de réservation a été acceptée. Veuillez procéder au paiement.',
      bookingId,
      announcementId: announcement.id,
    })
    if (notifError) {
      console.error('Notification creation failed (non-blocking):', notifError)
    }

    // TODO: Envoyer email à l'expéditeur

    revalidatePath('/dashboard/messages')
    revalidatePath('/dashboard/annonces')

    return {
      success: true,
      message: 'Demande acceptée avec succès',
    }
  } catch (error) {
    console.error('Error accepting booking:', error)
    return {
      error: 'Une erreur est survenue. Veuillez réessayer.',
    }
  }
}

/**
 * Refuse une demande de réservation
 */
export async function refuseBooking(bookingId: string, reason: string) {
  const supabase = await createClient()

  // Vérifier l'authentification
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      error: 'Vous devez être connecté',
    }
  }

  // Récupérer le booking avec l'annonce
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select(
      `
      *,
      announcements:announcement_id (
        id,
        traveler_id
      )
    `
    )
    .eq('id', bookingId)
    .single()

  if (bookingError || !booking) {
    return {
      error: 'Demande introuvable',
    }
  }

  const announcement = booking.announcements as any

  // Vérifier que l'utilisateur est le voyageur
  if (announcement.traveler_id !== user.id) {
    return {
      error: "Vous n'êtes pas autorisé à refuser cette demande",
    }
  }

  // Vérifier que le booking est en attente
  if (booking.status !== 'pending') {
    return {
      error: "Cette demande n'est plus en attente",
    }
  }

  if (!reason || reason.trim().length < 5) {
    return {
      error: 'Veuillez fournir une raison de refus (minimum 5 caractères)',
    }
  }

  try {
    // Mettre à jour le booking
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        refused_reason: reason.trim(),
        refused_at: new Date().toISOString(),
      })
      .eq('id', bookingId)

    if (updateError) {
      console.error('Error refusing booking:', updateError)
      return {
        error: 'Erreur lors du refus de la demande',
      }
    }

    // Créer notification pour l'expéditeur (non-bloquant)
    const { error: notifError } = await createSystemNotification({
      userId: booking.sender_id,
      type: 'booking_refused',
      title: 'Demande refusée',
      content: `Votre demande de réservation a été refusée. Raison : ${reason.trim()}`,
      bookingId,
      announcementId: announcement.id,
    })
    if (notifError) {
      console.error('Notification creation failed (non-blocking):', notifError)
    }

    // TODO: Envoyer email à l'expéditeur

    revalidatePath('/dashboard/messages')
    revalidatePath('/dashboard/annonces')

    return {
      success: true,
      message: 'Demande refusée',
    }
  } catch (error) {
    console.error('Error refusing booking:', error)
    return {
      error: 'Une erreur est survenue. Veuillez réessayer.',
    }
  }
}

/**
 * Récupère les demandes actives pour les annonces du voyageur
 */
export async function getPendingBookingRequests() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      error: 'Non authentifié',
    }
  }

  // Récupérer les annonces du voyageur
  const { data: announcements } = await supabase
    .from('announcements')
    .select('id')
    .eq('traveler_id', user.id)

  if (!announcements || announcements.length === 0) {
    return {
      bookings: [],
    }
  }

  const announcementIds = announcements.map(a => a.id)

  // Récupérer les bookings actifs pour ces annonces
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(
      `
      *,
      announcements:announcement_id (
        departure_city,
        arrival_city,
        departure_country,
        arrival_country,
        departure_date,
        price_per_kg
      )
    `
    )
    .in('status', ['pending', 'accepted', 'paid'])
    .in('announcement_id', announcementIds)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching booking requests:', error)
    return {
      error: 'Erreur lors de la récupération des demandes',
    }
  }

  const senderIds = (bookings || []).map((booking: any) => booking.sender_id)
  const { data: publicProfiles } = await getPublicProfiles(supabase, senderIds)
  const profileById = mapPublicProfilesById(publicProfiles || [])

  const enrichedBookings =
    (bookings || []).map((booking: any) => ({
      ...booking,
      sender: profileById[booking.sender_id] || null,
    })) || []

  return {
    bookings: enrichedBookings,
  }
}

/**
 * Marque une notification comme lue
 */
export async function markNotificationAsRead(notificationId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      error: 'Non authentifié',
    }
  }

  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', user.id)

  if (error) {
    return {
      error: 'Erreur lors de la mise à jour de la notification',
    }
  }

  revalidatePath('/dashboard/messages')
  return {
    success: true,
  }
}

/**
 * Supprime une notification
 */
export async function deleteNotification(notificationId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      error: 'Non authentifié',
    }
  }

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting notification:', error)
    return {
      error: 'Erreur lors de la suppression de la notification',
    }
  }

  revalidatePath('/dashboard/messages')
  return {
    success: true,
  }
}

/**
 * Récupère le nombre de notifications non lues
 */
export async function getUnreadNotificationsCount() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      count: 0,
    }
  }

  const { data, error } = await (supabase.rpc as any)(
    'count_unread_notifications',
    {
      p_user_id: user.id,
    }
  )

  if (error) {
    return {
      count: 0,
    }
  }

  return {
    count: data || 0,
  }
}
