/**
 * Server Actions pour les scans QR code
 */

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from "@/lib/shared/db/server"
import { notifyUser } from '@/lib/core/notifications/actions'
import { generateDepositProof, generateDeliveryProof } from '@/lib/shared/services/pdf/generation'
import { validateImageUpload } from "@/lib/shared/security/upload-validation"
import { uploadRateLimit } from "@/lib/shared/security/rate-limit"

/**
 * Gère le scan QR code pour le dépôt du colis
 */
export async function handleDepositScan(
  bookingId: string,
  qrCode: string,
  photoDataURL: string,
  signatureDataURL: string,
  location?: { lat: number; lng: number }
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
    // Vérifier que le QR code correspond au booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, qr_code, status, sender_id, traveler_id')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return {
        error: 'Réservation introuvable',
      }
    }

    if (booking.qr_code !== qrCode) {
      return {
        error: 'QR code invalide. Veuillez scanner le bon QR code.',
      }
    }

    // Vérifier que l'utilisateur est autorisé (expéditeur ou voyageur)
    if (booking.sender_id !== user.id && booking.traveler_id !== user.id) {
      return {
        error: 'Vous n\'êtes pas autorisé à effectuer ce scan',
      }
    }

    // Vérifier le statut (doit être confirmé après paiement)
    if (booking.status !== 'confirmed') {
      return {
        error: `Le colis ne peut pas être déposé. Statut actuel : ${booking.status}`,
      }
    }

    // Upload photo
    const photoFileName = `deposit_${bookingId}_${Date.now()}.png`
    const photoBuffer = Buffer.from(photoDataURL.split(',')[1], 'base64')
    const { data: photoUpload, error: photoError } = await supabase.storage
      .from('package-photos')
      .upload(photoFileName, photoBuffer, {
        contentType: 'image/png',
      })

    if (photoError) {
      console.error('Error uploading photo:', photoError)
      return {
        error: 'Erreur lors de l\'upload de la photo',
      }
    }

    const { data: photoUrlData } = await supabase.storage
      .from('package-photos')
      .getPublicUrl(photoFileName)

    // Upload signature
    const signatureFileName = `${user.id}/deposit_signature_${bookingId}_${Date.now()}.png`
    const signatureBase64 = signatureDataURL.includes(',') ? signatureDataURL.split(',')[1] : signatureDataURL
    const signatureBuffer = Buffer.from(signatureBase64, 'base64')
    const { data: signatureUpload, error: signatureError } = await supabase.storage
      .from('signatures')
      .upload(signatureFileName, signatureBuffer, {
        contentType: 'image/png',
      })

    if (signatureError) {
      console.error('Error uploading signature:', signatureError)
      return {
        error: 'Erreur lors de l\'upload de la signature',
      }
    }

    const { data: signatureUrlData } = await supabase.storage
      .from('signatures')
      .getPublicUrl(signatureFileName)

    // Mettre à jour le booking
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'in_transit',
        deposited_at: new Date().toISOString(),
        deposit_photo_url: photoUrlData.publicUrl,
        deposit_signature_url: signatureUrlData.publicUrl,
        deposit_location_lat: location?.lat || null,
        deposit_location_lng: location?.lng || null,
      })
      .eq('id', bookingId)

    if (updateError) {
      console.error('Error updating booking:', updateError)
      return {
        error: 'Erreur lors de la mise à jour de la réservation',
      }
    }

    // Créer log de scan
    await (supabase.from as any)('qr_scan_logs').insert({
      booking_id: bookingId,
      scan_type: 'deposit',
      scanned_by: user.id,
      qr_code: qrCode,
      location_lat: location?.lat || null,
      location_lng: location?.lng || null,
      photo_url: photoUrlData.publicUrl,
      signature_url: signatureUrlData.publicUrl,
    })

    // Notifications
    await notifyUser({
      user_id: booking.sender_id,
      type: 'deposit_reminder',
      title: 'Colis déposé',
      content: 'Votre colis a été déposé et est maintenant en transit',
      booking_id: bookingId,
    })

    await notifyUser({
      user_id: booking.traveler_id,
      type: 'transit_started',
      title: 'Colis en transit',
      content: 'Le colis a été déposé et est maintenant en transit',
      booking_id: bookingId,
    })

    // Générer PDF preuve de dépôt
    await generateDepositProof(bookingId)

    revalidatePath(`/dashboard/colis/${bookingId}`)
    revalidatePath('/dashboard/colis')

    return {
      success: true,
      message: 'Dépôt confirmé avec succès',
    }
  } catch (error) {
    console.error('Error handling deposit scan:', error)
    return {
      error: 'Une erreur est survenue. Veuillez réessayer.',
    }
  }
}

/**
 * Gère le scan QR code pour la livraison du colis
 */
export async function handleDeliveryScan(
  bookingId: string,
  qrCode: string,
  photoDataURL: string,
  signatureDataURL: string,
  location?: { lat: number; lng: number }
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
    // Vérifier que le QR code correspond au booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, qr_code, status, sender_id, traveler_id')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return {
        error: 'Réservation introuvable',
      }
    }

    if (booking.qr_code !== qrCode) {
      return {
        error: 'QR code invalide. Veuillez scanner le bon QR code.',
      }
    }

    // Vérifier que l'utilisateur est autorisé (destinataire ou voyageur)
    // Note: Pour l'instant, on suppose que le destinataire est le sender_id
    // À adapter selon votre logique métier
    if (booking.sender_id !== user.id && booking.traveler_id !== user.id) {
      return {
        error: 'Vous n\'êtes pas autorisé à effectuer ce scan',
      }
    }

    // Vérifier le statut
    if (booking.status !== 'in_transit') {
      return {
        error: `Le colis ne peut pas être livré. Statut actuel : ${booking.status}`,
      }
    }

    // Upload photo
    const photoFileName = `${user.id}/delivery_${bookingId}_${Date.now()}.png`
    const photoBase64 = photoDataURL.includes(',') ? photoDataURL.split(',')[1] : photoDataURL
    const photoBuffer = Buffer.from(photoBase64, 'base64')
    const { data: photoUpload, error: photoError } = await supabase.storage
      .from('package-photos')
      .upload(photoFileName, photoBuffer, {
        contentType: 'image/png',
      })

    if (photoError) {
      console.error('Error uploading photo:', photoError)
      return {
        error: 'Erreur lors de l\'upload de la photo',
      }
    }

    const { data: photoUrlData } = await supabase.storage
      .from('package-photos')
      .getPublicUrl(photoFileName)

    // Upload signature
    const signatureFileName = `${user.id}/delivery_signature_${bookingId}_${Date.now()}.png`
    const signatureBase64 = signatureDataURL.includes(',') ? signatureDataURL.split(',')[1] : signatureDataURL
    const signatureBuffer = Buffer.from(signatureBase64, 'base64')
    const { data: signatureUpload, error: signatureError } = await supabase.storage
      .from('signatures')
      .upload(signatureFileName, signatureBuffer, {
        contentType: 'image/png',
      })

    if (signatureError) {
      console.error('Error uploading signature:', signatureError)
      return {
        error: 'Erreur lors de l\'upload de la signature',
      }
    }

    const { data: signatureUrlData } = await supabase.storage
      .from('signatures')
      .getPublicUrl(signatureFileName)

    // Mettre à jour le booking
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'delivered',
        delivered_at: new Date().toISOString(),
        delivery_photo_url: photoUrlData.publicUrl,
        delivery_signature_url: signatureUrlData.publicUrl,
        delivery_location_lat: location?.lat || null,
        delivery_location_lng: location?.lng || null,
      })
      .eq('id', bookingId)

    if (updateError) {
      console.error('Error updating booking:', updateError)
      return {
        error: 'Erreur lors de la mise à jour de la réservation',
      }
    }

    // Créer log de scan
    await (supabase.from as any)('qr_scan_logs').insert({
      booking_id: bookingId,
      scan_type: 'delivery',
      scanned_by: user.id,
      qr_code: qrCode,
      location_lat: location?.lat || null,
      location_lng: location?.lng || null,
      photo_url: photoUrlData.publicUrl,
      signature_url: signatureUrlData.publicUrl,
    })

    // Notifications
    await notifyUser({
      user_id: booking.sender_id,
      type: 'delivery_reminder',
      title: 'Colis livré',
      content: 'Votre colis a été livré avec succès',
      booking_id: bookingId,
    })

    // Les notifications rating_request sont créées automatiquement par le trigger SQL

    // Générer PDF preuve de livraison
    await generateDeliveryProof(bookingId)

    // TODO: Déclencher paiement voyageur (Stripe Transfer)
    // await processPayoutToTraveler(bookingId)

    revalidatePath(`/dashboard/colis/${bookingId}`)
    revalidatePath('/dashboard/colis')

    return {
      success: true,
      message: 'Livraison confirmée avec succès',
    }
  } catch (error) {
    console.error('Error handling delivery scan:', error)
    return {
      error: 'Une erreur est survenue. Veuillez réessayer.',
    }
  }
}

/**
 * Récupère les détails d'un booking par QR code
 */
export async function getBookingByQRCode(qrCode: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      error: 'Non authentifié',
    }
  }

  const { data: booking, error } = await supabase
    .from('bookings')
    .select(
      `
      id,
      qr_code,
      status,
      sender_id,
      traveler_id,
      weight_kg,
      announcements:announcement_id (
        origin_city,
        destination_city,
        departure_date
      )
    `
    )
    .eq('qr_code', qrCode)
    .single()

  if (error || !booking) {
    return {
      error: 'QR code introuvable ou invalide',
    }
  }

  // Vérifier que l'utilisateur a accès à ce booking
  if (booking.sender_id !== user.id && booking.traveler_id !== user.id) {
    return {
      error: 'Vous n\'êtes pas autorisé à accéder à cette réservation',
    }
  }

  return {
    booking,
  }
}

