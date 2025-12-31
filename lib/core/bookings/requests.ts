/**
 * Server Actions pour la gestion des demandes de réservation (côté voyageur)
 */

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from "@/lib/shared/db/server"

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
      error: 'Vous n\'êtes pas autorisé à accepter cette demande',
    }
  }

  // Vérifier que le booking est en attente
  if (booking.status !== 'pending') {
    return {
      error: 'Cette demande n\'est plus en attente',
    }
  }

  // Vérifier que l'annonce est toujours active
  if (announcement.status !== 'active') {
    return {
      error: 'Cette annonce n\'est plus disponible',
    }
  }

  // Calculer le poids réservé actuel (y compris les autres bookings confirmés)
  const { data: existingBookings } = await supabase
    .from('bookings')
    .select('kilos_requested, weight_kg')
    .eq('announcement_id', announcement.id)
    .in('status', ['pending', 'accepted', 'in_transit'])

  const reservedWeight =
    existingBookings?.reduce((sum: number, b: any) => sum + ((b.kilos_requested || b.weight_kg) || 0), 0) || 0
  const availableWeight = (announcement.available_kg || 0) - reservedWeight

  // Vérifier la capacité disponible
  if ((booking.kilos_requested || 0) > availableWeight) {
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
        error: 'Erreur lors de l\'acceptation de la demande',
      }
    }

    // Créer notification pour l'expéditeur
    await (supabase.rpc as any)('create_notification', {
      p_user_id: booking.sender_id,
      p_type: 'booking_accepted',
      p_title: 'Demande acceptée',
      p_content: `Votre demande de réservation a été acceptée. Veuillez procéder au paiement.`,
      p_booking_id: bookingId,
      p_announcement_id: announcement.id,
    })

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
      error: 'Vous n\'êtes pas autorisé à refuser cette demande',
    }
  }

  // Vérifier que le booking est en attente
  if (booking.status !== 'pending') {
    return {
      error: 'Cette demande n\'est plus en attente',
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

    // Créer notification pour l'expéditeur
    await (supabase.rpc as any)('create_notification', {
      p_user_id: booking.sender_id,
      p_type: 'booking_refused',
      p_title: 'Demande refusée',
      p_content: `Votre demande de réservation a été refusée. Raison : ${reason.trim()}`,
      p_booking_id: bookingId,
      p_announcement_id: announcement.id,
    })

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
 * Récupère les demandes en attente pour les annonces du voyageur
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

  const announcementIds = announcements.map((a) => a.id)

  // Récupérer les bookings en attente pour ces annonces
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
      ),
      sender:sender_id (
        firstname,
        lastname,
        avatar_url
      )
    `
    )
    .eq('status', 'pending')
    .in('announcement_id', announcementIds)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching booking requests:', error)
    return {
      error: 'Erreur lors de la récupération des demandes',
    }
  }

  return {
    bookings: bookings || [],
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

  const { data, error } = await (supabase.rpc as any)('count_unread_notifications', {
    p_user_id: user.id,
  })

  if (error) {
    return {
      count: 0,
    }
  }

  return {
    count: data || 0,
  }
}

