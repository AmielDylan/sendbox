/**
 * Server Actions pour le workflow des réservations
 */

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/shared/db/server'
import { createAdminClient } from '@/lib/shared/db/admin'
import { createSystemNotification } from '@/lib/core/notifications/system'
import { isFeatureEnabled } from '@/lib/shared/config/features'
import { sendEmail } from '@/lib/shared/services/email/client'
import { getCancellationPolicy } from '@/lib/core/bookings/cancellation-policy'

type ScanStep = 'deposit' | 'delivery'

export async function getBookingForScanStep(bookingId: string, step: ScanStep) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      error: 'Vous devez etre connecte',
      redirectTo: '/login',
    }
  }

  const admin = createAdminClient()
  const { data: booking, error } = await admin
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single()

  if (error || !booking) {
    return {
      error: 'Reservation introuvable',
      redirectTo: '/dashboard/colis',
    }
  }

  if (booking.traveler_id !== user.id) {
    return {
      error: 'Acces non autorise',
      redirectTo: '/dashboard/colis',
    }
  }

  const validDepositStatuses = ['accepted', 'confirmed', 'paid']
  const isValidStatus =
    step === 'deposit'
      ? validDepositStatuses.includes(booking.status)
      : booking.status === 'in_transit'

  if (!isValidStatus) {
    return {
      error:
        step === 'deposit'
          ? 'La reservation doit etre acceptee et la mise en relation validee'
          : 'Le colis doit etre en transit',
      redirectTo: `/dashboard/colis/${bookingId}`,
    }
  }

  return { booking }
}

/**
 * Annule une réservation avec raison.
 *
 * En V1, le paiement concerne les frais Sendbox de mise en relation, pas le
 * prix du transport. Une réservation "confirmed" signifie donc que les
 * coordonnées ont été déverrouillées.
 */
export async function cancelBookingWithReason(
  bookingId: string,
  reason: string
) {
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
      error: "Vous n'êtes pas autorisé à annuler cette réservation",
    }
  }

  const policy = getCancellationPolicy({
    status: booking.status,
    paidAt: booking.paid_at,
    actorRole: isSender ? 'sender' : isTraveler ? 'traveler' : 'unknown',
  })

  if (!policy.canCancel) {
    return {
      error: 'Cette réservation ne peut pas être annulée à ce stade',
    }
  }

  const cancelledAt = new Date().toISOString()

  try {
    const { data: updatedRows, error: updateError } = await supabase
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
      .in('status', ['pending', 'accepted', 'paid', 'confirmed'])
      .select('id')

    if (updateError || !updatedRows?.length) {
      console.error('Error cancelling booking:', updateError)
      return {
        error: "Erreur lors de l'annulation",
      }
    }

    if (policy.reputationPenalty && isTraveler) {
      const REPUTATION_PENALTY = 0.3
      try {
        const profileClient = process.env.SUPABASE_SERVICE_ROLE_KEY
          ? createAdminClient()
          : supabase
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
    const cancelerLabel = isSender ? "L'expéditeur" : 'Le voyageur'

    const { error: notifError } = await createSystemNotification({
      userId: otherUserId,
      type: 'system_alert',
      title: 'Réservation annulée',
      content: `${cancelerLabel} a annulé la réservation. Raison : ${normalizedReason}`,
      bookingId,
      announcementId: booking.announcement_id,
    })

    if (notifError) {
      console.error('Notification creation failed (non-blocking):', notifError)
    }

    ;(async () => {
      const adminDb = createAdminClient()
      const { data: otherProfile } = await adminDb
        .from('profiles')
        .select('email, firstname')
        .eq('id', otherUserId)
        .single()
      if (otherProfile?.email) {
        await sendEmail({
          to: otherProfile.email,
          subject: 'Mise en relation annulée',
          template: 'notification',
          data: {
            title: 'Réservation annulée',
            content: `${otherProfile.firstname ? `Bonjour ${otherProfile.firstname},\n\n` : ''}${cancelerLabel} a annulé la réservation.\n\nMotif : ${normalizedReason}`,
            ctaText: 'Voir mes réservations',
            ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/colis/${bookingId}`,
          },
        })
      }
    })().catch(console.error)

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
      error: "Vous n'êtes pas autorisé à supprimer cette réservation",
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
      .map(url => {
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
      error: "Vous n'êtes pas autorisé à effectuer cette action",
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
        "Veuillez compléter votre vérification d'identité pour déposer un colis."

      if (profile.kyc_status === 'pending') {
        errorMessage = 'Vérification en cours'
        errorDetails =
          "Votre vérification d'identité est en cours d'examen. Vous pourrez déposer des colis une fois celle-ci approuvée (24-48h)."
      } else if (profile.kyc_status === 'rejected') {
        errorMessage = 'Vérification refusée'
        errorDetails = profile.kyc_rejection_reason
          ? `Votre vérification a été refusée : ${profile.kyc_rejection_reason}. Veuillez soumettre de nouveaux documents.`
          : 'Votre vérification a été refusée. Veuillez soumettre de nouveaux documents depuis vos réglages.'
      } else if (profile.kyc_status === 'incomplete') {
        errorMessage = "Vérification d'identité incomplète"
        errorDetails =
          "Veuillez soumettre vos documents d'identité pour déposer un colis."
      }

      return {
        error: errorMessage,
        errorDetails,
        field: 'kyc',
      }
    }
  }

  // Vérifier le statut
  if (
    booking.status !== 'accepted' &&
    booking.status !== 'confirmed' &&
    booking.status !== 'paid'
  ) {
    return {
      error: 'La réservation doit être acceptée et la mise en relation validée',
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
    const { data: updatedRows, error: updateError } = await supabase
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
      .in('status', ['accepted', 'confirmed', 'paid'])
      .select('id')

    if (updateError || !updatedRows?.length) {
      console.error('Error marking as in transit:', updateError)
      return {
        error: 'Erreur lors de la mise à jour',
      }
    }

    // Notifier l'expéditeur (non-bloquant)
    const { error: notifError } = await createSystemNotification({
      userId: booking.sender_id,
      type: 'transit_started',
      title: 'Colis en transit',
      content: 'Votre colis a été pris en charge par le voyageur',
      bookingId,
      announcementId: booking.announcement_id,
    })
    if (notifError) {
      console.error('Notification creation failed (non-blocking):', notifError)
    }

    ;(async () => {
      const adminDb = createAdminClient()
      const { data: senderProfile } = await adminDb
        .from('profiles')
        .select('email, firstname')
        .eq('id', booking.sender_id)
        .single()
      if (senderProfile?.email) {
        await sendEmail({
          to: senderProfile.email,
          subject: 'Votre colis est en route',
          template: 'notification',
          data: {
            title: 'Colis en transit',
            content: `${senderProfile.firstname ? `Bonjour ${senderProfile.firstname},\n\n` : ''}Votre colis a été pris en charge par le voyageur et est maintenant en transit.`,
            ctaText: 'Suivre mon colis',
            ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/colis/${bookingId}`,
          },
        })
      }
    })().catch(console.error)

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
      error: "Vous n'êtes pas autorisé à effectuer cette action",
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
        "Veuillez compléter votre vérification d'identité pour livrer un colis."

      if (profile.kyc_status === 'pending') {
        errorMessage = 'Vérification en cours'
        errorDetails =
          "Votre vérification d'identité est en cours d'examen. Vous pourrez livrer des colis une fois celle-ci approuvée (24-48h)."
      } else if (profile.kyc_status === 'rejected') {
        errorMessage = 'Vérification refusée'
        errorDetails = profile.kyc_rejection_reason
          ? `Votre vérification a été refusée : ${profile.kyc_rejection_reason}. Veuillez soumettre de nouveaux documents.`
          : 'Votre vérification a été refusée. Veuillez soumettre de nouveaux documents depuis vos réglages.'
      } else if (profile.kyc_status === 'incomplete') {
        errorMessage = "Vérification d'identité incomplète"
        errorDetails =
          "Veuillez soumettre vos documents d'identité pour livrer un colis."
      }

      return {
        error: errorMessage,
        errorDetails,
        field: 'kyc',
      }
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
    const { data: updatedRows, error: updateError } = await supabase
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
      .eq('status', 'in_transit')
      .select('id')

    if (updateError || !updatedRows?.length) {
      console.error('Error marking as delivered:', updateError)
      return {
        error: 'Erreur lors de la mise à jour',
      }
    }

    // Notifier l'expéditeur (non-bloquant)
    const { error: notifError } = await createSystemNotification({
      userId: booking.sender_id,
      type: 'delivery_reminder',
      title: 'Colis livré',
      content:
        'Votre colis a été livré. Merci de confirmer la réception sur Sendbox pour clôturer la mission et ouvrir les avis.',
      bookingId,
      announcementId: booking.announcement_id,
    })
    if (notifError) {
      console.error('Notification creation failed (non-blocking):', notifError)
    }

    ;(async () => {
      const adminDb = createAdminClient()
      const { data: senderProfile } = await adminDb
        .from('profiles')
        .select('email, firstname')
        .eq('id', booking.sender_id)
        .single()
      if (senderProfile?.email) {
        await sendEmail({
          to: senderProfile.email,
          subject: 'Votre colis a été livré — confirmez la réception',
          template: 'notification',
          data: {
            title: 'Colis livré',
            content: `${senderProfile.firstname ? `Bonjour ${senderProfile.firstname},\n\n` : ''}Votre colis a été livré. Merci de confirmer la réception sur Sendbox pour clôturer la mission et ouvrir les avis.`,
            ctaText: 'Confirmer la réception',
            ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/colis/${bookingId}`,
          },
        })
      }
    })().catch(console.error)

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

/**
 * Expéditeur confirme la livraison et clôture la mission côté Sendbox.
 */
export async function confirmDeliveryReceipt(bookingId: string) {
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
    .select(
      'id, status, sender_id, traveler_id, delivery_confirmed_at, announcement_id'
    )
    .eq('id', bookingId)
    .single()

  if (bookingError || !booking) {
    return {
      error: 'Réservation introuvable',
    }
  }

  if (booking.sender_id !== user.id) {
    return {
      error: "Vous n'êtes pas autorisé à confirmer cette livraison",
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
        "Veuillez compléter votre vérification d'identité pour confirmer la réception."

      if (profile.kyc_status === 'pending') {
        errorMessage = 'Vérification en cours'
        errorDetails =
          "Votre vérification d'identité est en cours d'examen. Vous pourrez confirmer la réception une fois celle-ci approuvée (24-48h)."
      } else if (profile.kyc_status === 'rejected') {
        errorMessage = 'Vérification refusée'
        errorDetails = profile.kyc_rejection_reason
          ? `Votre vérification a été refusée : ${profile.kyc_rejection_reason}. Veuillez soumettre de nouveaux documents.`
          : 'Votre vérification a été refusée. Veuillez soumettre de nouveaux documents depuis vos réglages.'
      } else if (profile.kyc_status === 'incomplete') {
        errorMessage = "Vérification d'identité incomplète"
        errorDetails =
          "Veuillez soumettre vos documents d'identité pour confirmer la réception."
      }

      return {
        error: errorMessage,
        errorDetails,
        field: 'kyc',
      }
    }
  }

  if (booking.status !== 'delivered') {
    return {
      error: 'La livraison doit être marquée comme livrée avant confirmation',
    }
  }

  if (booking.delivery_confirmed_at) {
    return {
      error: 'La livraison est déjà confirmée',
    }
  }

  const confirmedAt = new Date().toISOString()

  const { data: updatedRows, error: updateError } = await supabase
    .from('bookings')
    .update({
      delivery_confirmed_at: confirmedAt,
      delivery_confirmed_by: user.id,
    })
    .eq('id', bookingId)
    .eq('status', 'delivered')
    .is('delivery_confirmed_at', null)
    .select('id')

  if (updateError || !updatedRows?.length) {
    console.error('Error confirming delivery:', updateError)
    return {
      error: 'Erreur lors de la confirmation',
    }
  }

  const { error: servicesError } = await (supabase.rpc as any)(
    'increment_completed_services',
    {
      p_user_id: booking.traveler_id,
    }
  )
  if (servicesError) {
    console.error('Error incrementing completed services:', servicesError)
  }

  const { error: notifError } = await createSystemNotification({
    userId: booking.traveler_id,
    type: 'delivery_confirmed',
    title: 'Livraison confirmée',
    content:
      'Le client a confirmé la remise. La mission est clôturée et les avis peuvent être déposés.',
    bookingId,
    announcementId: booking.announcement_id,
  })

  if (notifError) {
    console.error('Notification creation failed (non-blocking):', notifError)
  }

  ;(async () => {
    const adminDb = createAdminClient()
    const { data: travelerProfile } = await adminDb
      .from('profiles')
      .select('email, firstname')
      .eq('id', booking.traveler_id)
      .single()
    if (travelerProfile?.email) {
      await sendEmail({
        to: travelerProfile.email,
        subject: 'Livraison confirmée — votre mission est terminée',
        template: 'notification',
        data: {
          title: 'Livraison confirmée',
          content: `${travelerProfile.firstname ? `Bonjour ${travelerProfile.firstname},\n\n` : ''}Le client a confirmé la remise. La mission est clôturée et les avis peuvent être déposés. Merci d'avoir utilisé Sendbox !`,
          ctaText: 'Voir mes réservations',
          ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/colis/${bookingId}`,
        },
      })
    }
  })().catch(console.error)

  revalidatePath('/dashboard/colis')
  revalidatePath(`/dashboard/colis/${bookingId}`)
  revalidatePath('/dashboard/notifications')

  return {
    success: true,
    message: 'Livraison confirmée',
  }
}
