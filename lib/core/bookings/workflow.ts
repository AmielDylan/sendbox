/**
 * Server Actions pour le workflow des réservations
 */

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from "@/lib/shared/db/server"

/**
 * Expéditeur annule une réservation (avant acceptation)
 */
export async function cancelBooking(bookingId: string) {
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

  // Vérifier que l'utilisateur est l'expéditeur
  if (booking.sender_id !== user.id) {
    return {
      error: 'Vous n\'êtes pas autorisé à annuler cette réservation',
    }
  }

  // Vérifier que le booking n'est pas déjà livré ou en transit
  if (booking.status === 'delivered' || booking.status === 'in_transit') {
    return {
      error: 'Cette réservation ne peut plus être annulée',
    }
  }

  try {
    // Mettre à jour le statut
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        refused_reason: 'Annulé par l\'expéditeur',
        refused_at: new Date().toISOString(),
      })
      .eq('id', bookingId)

    if (updateError) {
      console.error('Error cancelling booking:', updateError)
      return {
        error: 'Erreur lors de l\'annulation',
      }
    }

    // Si la réservation était confirmée et payée, initier un remboursement
    if (booking.status === 'confirmed' && booking.paid_at) {
      // TODO: Implémenter logique de remboursement Stripe
      console.log('TODO: Initiate refund for booking', bookingId)
    }

    // Notifier le voyageur si la réservation était confirmée
    if (booking.status === 'confirmed') {
      await (supabase.rpc as any)('create_notification', {
        p_user_id: booking.traveler_id,
        p_type: 'booking_cancelled',
        p_title: 'Réservation annulée',
        p_content: 'Une réservation a été annulée par l\'expéditeur',
        p_booking_id: bookingId,
        p_announcement_id: booking.announcement_id,
      })
    }

    revalidatePath('/dashboard/colis')
    revalidatePath(`/dashboard/colis/${bookingId}`)

    return {
      success: true,
      message: 'Réservation annulée avec succès',
    }
  } catch (error) {
    console.error('Error cancelling booking:', error)
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
  if (booking.status !== 'confirmed') {
    return {
      error: 'La réservation doit être confirmée',
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
 * Voyageur scanne le QR code de livraison et marque le colis livré
 */
export async function markAsDelivered(
  bookingId: string,
  qrCode: string,
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





