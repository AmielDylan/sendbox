/**
 * Server Actions pour le workflow des réservations
 */

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from "@/lib/shared/db/server"
import { createAdminClient } from "@/lib/shared/db/admin"

/**
 * Annule une réservation avec raison (acceptée non payée par les deux parties,
 * ou payée par le voyageur avec malus de réputation).
 */
export async function cancelBookingWithReason(bookingId: string, reason: string) {
  const supabase = await createClient()
  const normalizedReason = reason.trim()

  if (normalizedReason.length < 5) {
    return {
      error: 'Veuillez fournir une raison (minimum 5 caractères)',
    }
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      error: 'Vous devez être connecté',
    }
  }

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, status, paid_at, sender_id, traveler_id, announcement_id')
    .eq('id', bookingId)
    .single()

  if (bookingError || !booking) {
    return {
      error: 'Réservation introuvable',
    }
  }

  const isSender = booking.sender_id === user.id
  const isTraveler = booking.traveler_id === user.id

  if (!isSender && !isTraveler) {
    return {
      error: 'Vous n\'êtes pas autorisé à annuler cette réservation',
    }
  }

  const isPaid = booking.status === 'paid' || Boolean(booking.paid_at)

  if (booking.status === 'accepted' && !isPaid) {
    // Autorisé pour expéditeur et voyageur
  } else if (isPaid && isTraveler) {
    // Autorisé pour le voyageur (annonceur) avec malus
  } else {
    return {
      error: 'Cette réservation ne peut pas être annulée à ce stade',
    }
  }

  const cancelledAt = new Date().toISOString()

  try {
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        refused_reason: normalizedReason,
        refused_at: cancelledAt,
        cancelled_reason: normalizedReason,
        cancelled_at: cancelledAt,
        cancelled_by: user.id,
      })
      .eq('id', bookingId)

    if (updateError) {
      console.error('Error cancelling booking:', updateError)
      return {
        error: 'Erreur lors de l\'annulation',
      }
    }

    if (isPaid && isTraveler) {
      const REPUTATION_PENALTY = 0.3
      try {
        const profileClient =
          process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : supabase
        const { data: profile } = await profileClient
          .from('profiles')
          .select('rating')
          .eq('id', user.id)
          .single()

        const currentRating = Number(profile?.rating || 0)
        const nextRating = Math.max(0, currentRating - REPUTATION_PENALTY)

        const { error: ratingError } = await profileClient
          .from('profiles')
          .update({ rating: nextRating })
          .eq('id', user.id)

        if (ratingError) {
          console.warn('Reputation penalty update failed:', ratingError)
        }
      } catch (ratingError) {
        console.warn('Reputation penalty update failed:', ratingError)
      }
    }

    const otherUserId = isSender ? booking.traveler_id : booking.sender_id
    const cancelerLabel = isSender ? 'L\'expéditeur' : 'Le voyageur'

    try {
      await (supabase.rpc as any)('create_notification', {
        p_user_id: otherUserId,
        p_type: 'booking_cancelled',
        p_title: 'Réservation annulée',
        p_content: `${cancelerLabel} a annulé la réservation. Raison : ${normalizedReason}`,
        p_booking_id: bookingId,
        p_announcement_id: booking.announcement_id,
      })
    } catch (notifError) {
      console.error('Notification creation failed (non-blocking):', notifError)
    }

    revalidatePath('/dashboard/colis')
    revalidatePath(`/dashboard/colis/${bookingId}`)
    revalidatePath('/dashboard/messages')

    return {
      success: true,
      message: 'Réservation annulée',
    }
  } catch (error) {
    console.error('Error cancelling booking:', error)
    return {
      error: 'Une erreur est survenue. Veuillez réessayer.',
    }
  }
}

/**
 * Supprime une réservation annulée (expéditeur ou voyageur)
 */
export async function deleteCancelledBooking(bookingId: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      error: 'Vous devez être connecté',
    }
  }

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, status, sender_id, traveler_id, package_photos, refused_at')
    .eq('id', bookingId)
    .single()

  if (bookingError || !booking) {
    return {
      error: 'Réservation introuvable',
    }
  }

  if (booking.sender_id !== user.id && booking.traveler_id !== user.id) {
    return {
      error: 'Vous n\'êtes pas autorisé à supprimer cette réservation',
    }
  }

  if (booking.status !== 'cancelled' || !booking.refused_at) {
    return {
      error: 'Cette réservation ne peut pas être supprimée',
    }
  }

  try {
    // Nettoyer les photos du colis si présentes
    const photos = (booking.package_photos || []) as string[]
    const storagePrefix = '/storage/v1/object/public/package-photos/'
    const filePaths = photos
      .map((url) => {
        const index = url?.indexOf(storagePrefix) ?? -1
        if (index === -1) return null
        const path = url.slice(index + storagePrefix.length)
        return path.split('?')[0]
      })
      .filter((path): path is string => Boolean(path))

    if (filePaths.length > 0) {
      const { error: deletePhotosError } = await supabase.storage
        .from('package-photos')
        .remove(filePaths)
      if (deletePhotosError) {
        console.warn('Error deleting package photos:', deletePhotosError)
      }
    }

    const { error: deleteError } = await supabase
      .from('bookings')
      .delete()
      .eq('id', bookingId)

    if (deleteError) {
      console.error('Delete booking error:', deleteError)
      return {
        error: 'Erreur lors de la suppression de la réservation',
      }
    }

    revalidatePath('/dashboard/colis')
    return {
      success: true,
      message: 'Réservation supprimée',
    }
  } catch (error) {
    console.error('Delete booking error:', error)
    return {
      error: 'Une erreur est survenue. Veuillez réessayer.',
    }
  }
}

/**
 * Voyageur scanne le QR code de dépôt et marque le colis en transit
 */
export async function markAsInTransit(
  bookingId: string,
  qrCode: string,
  depositPhotoUrl: string,
  depositSignatureUrl: string,
  location: { lat: number; lng: number }
) {
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

  // Récupérer le booking
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single()

  if (bookingError || !booking) {
    return {
      error: 'Réservation introuvable',
    }
  }

  // Vérifier que l'utilisateur est le voyageur
  if (booking.traveler_id !== user.id) {
    return {
      error: 'Vous n\'êtes pas autorisé à effectuer cette action',
    }
  }

  // Vérifier le statut
  if (booking.status !== 'accepted' && booking.status !== 'paid') {
    return {
      error: 'La réservation doit être acceptée et payée',
    }
  }

  // Vérifier le QR code
  if (booking.qr_code !== qrCode) {
    return {
      error: 'QR code invalide',
    }
  }

  try {
    // Mettre à jour le booking
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'in_transit',
        deposited_at: new Date().toISOString(),
        deposit_photo_url: depositPhotoUrl,
        deposit_signature_url: depositSignatureUrl,
        deposit_location_lat: location.lat,
        deposit_location_lng: location.lng,
      })
      .eq('id', bookingId)

    if (updateError) {
      console.error('Error marking as in transit:', updateError)
      return {
        error: 'Erreur lors de la mise à jour',
      }
    }

    // Notifier l'expéditeur
    await (supabase.rpc as any)('create_notification', {
      p_user_id: booking.sender_id,
      p_type: 'booking_in_transit',
      p_title: 'Colis en transit',
      p_content: 'Votre colis a été pris en charge par le voyageur',
      p_booking_id: bookingId,
      p_announcement_id: booking.announcement_id,
    })

    revalidatePath('/dashboard/colis')
    revalidatePath(`/dashboard/colis/${bookingId}`)

    return {
      success: true,
      message: 'Colis marqué en transit',
    }
  } catch (error) {
    console.error('Error marking as in transit:', error)
    return {
      error: 'Une erreur est survenue. Veuillez réessayer.',
    }
  }
}

/**
 * Voyageur marque le colis livré (photo + signature + géolocalisation)
 */
export async function markAsDelivered(
  bookingId: string,
  deliveryPhotoUrl: string,
  deliverySignatureUrl: string,
  location: { lat: number; lng: number }
) {
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

  // Récupérer le booking
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single()

  if (bookingError || !booking) {
    return {
      error: 'Réservation introuvable',
    }
  }

  // Vérifier que l'utilisateur est le voyageur
  if (booking.traveler_id !== user.id) {
    return {
      error: 'Vous n\'êtes pas autorisé à effectuer cette action',
    }
  }

  // Vérifier le statut
  if (booking.status !== 'in_transit') {
    return {
      error: 'Le colis doit être en transit',
    }
  }

  try {
    // Mettre à jour le booking
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'delivered',
        delivered_at: new Date().toISOString(),
        delivery_photo_url: deliveryPhotoUrl,
        delivery_signature_url: deliverySignatureUrl,
        delivery_location_lat: location.lat,
        delivery_location_lng: location.lng,
      })
      .eq('id', bookingId)

    if (updateError) {
      console.error('Error marking as delivered:', updateError)
      return {
        error: 'Erreur lors de la mise à jour',
      }
    }

    // Déclencher le paiement au voyageur (release des fonds de l'escrow)
    // TODO: Implémenter le transfert Stripe Connect vers le voyageur
    console.log('TODO: Release escrow funds to traveler for booking', bookingId)

    // Notifier l'expéditeur
    await (supabase.rpc as any)('create_notification', {
      p_user_id: booking.sender_id,
      p_type: 'booking_delivered',
      p_title: 'Colis livré',
      p_content: 'Votre colis a été livré avec succès',
      p_booking_id: bookingId,
      p_announcement_id: booking.announcement_id,
    })

    // Mettre à jour les statistiques du voyageur
    await (supabase.rpc as any)('increment_user_stats', {
      p_user_id: booking.traveler_id,
    })

    revalidatePath('/dashboard/colis')
    revalidatePath(`/dashboard/colis/${bookingId}`)

    return {
      success: true,
      message: 'Colis marqué comme livré',
    }
  } catch (error) {
    console.error('Error marking as delivered:', error)
    return {
      error: 'Une erreur est survenue. Veuillez réessayer.',
    }
  }
}


