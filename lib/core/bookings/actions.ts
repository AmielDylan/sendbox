/**
 * Server Actions pour les réservations
 */

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/shared/db/server'
import { getPublicProfiles } from '@/lib/shared/db/queries/public-profiles'
import {
  createBookingSchema,
  type CreateBookingInput,
} from '@/lib/core/bookings/validations'
import {
  generatePackagePhotoFileName,
  validatePackagePhoto,
} from '@/lib/core/bookings/photos'
import { validateImageUpload } from '@/lib/shared/security/upload-validation'
import { uploadRateLimit } from '@/lib/shared/security/rate-limit'
import { FEATURES, isFeatureEnabled } from '@/lib/shared/config/features'
import { notifyUser } from '@/lib/core/notifications/actions'
import { calculateBookingPrice } from '@/lib/core/bookings/calculations'
import sharp from 'sharp'

/**
 * Traite et compresse une photo de colis (côté serveur uniquement)
 */
async function processPackagePhoto(file: File): Promise<Buffer> {
  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    const image = sharp(buffer)

    // Redimensionner si nécessaire (max 1920x1920) et compresser
    const processed = await image
      .resize(1920, 1920, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85, mozjpeg: true })
      .removeAlpha()
      .toBuffer()

    return Buffer.from(processed)
  } catch (error) {
    console.error('Error processing photo:', error)
    throw new Error('Erreur lors du traitement de la photo')
  }
}

const MAX_PENDING_BOOKINGS = 5

/**
 * Crée une nouvelle réservation
 */
export async function createBooking(
  formData: CreateBookingInput & {
    package_photos?: File[]
  }
) {
  const supabase = await createClient()

  // Vérifier l'authentification
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      error: 'Vous devez être connecté pour créer une réservation',
    }
  }

  // Récupérer le profil pour vérifier le KYC
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

  // Vérifier que le KYC est approuvé SEULEMENT si feature activée
  if (isFeatureEnabled('KYC_ENABLED') && profile.kyc_status !== 'approved') {
    let errorMessage = "Vérification d'identité requise pour continuer"
    let errorDetails =
      "Veuillez compléter votre vérification d'identité pour créer une réservation."

    if (profile.kyc_status === 'pending') {
      errorMessage = 'Vérification en cours'
      errorDetails =
        "Votre vérification d'identité est en cours d'examen. Vous pourrez créer des réservations une fois celle-ci approuvée (24-48h)."
    } else if (profile.kyc_status === 'rejected') {
      errorMessage = 'Vérification refusée'
      errorDetails = profile.kyc_rejection_reason
        ? `Votre vérification a été refusée : ${profile.kyc_rejection_reason}. Veuillez soumettre de nouveaux documents.`
        : 'Votre vérification a été refusée. Veuillez soumettre de nouveaux documents depuis vos réglages.'
    } else if (profile.kyc_status === 'incomplete') {
      errorMessage = "Vérification d'identité incomplète"
      errorDetails =
        "Veuillez soumettre vos documents d'identité pour créer une réservation."
    }

    return {
      error: errorMessage,
      errorDetails,
      field: 'kyc',
    }
  }

  // Vérifier le nombre de réservations en attente
  const { count: pendingCount, error: countError } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('sender_id', user.id)
    .eq('status', 'pending')

  if (countError) {
    return {
      error: 'Erreur lors de la vérification des réservations',
    }
  }

  if ((pendingCount || 0) >= MAX_PENDING_BOOKINGS) {
    return {
      error: `Vous avez atteint la limite de ${MAX_PENDING_BOOKINGS} réservations en attente. Veuillez finaliser ou annuler une réservation existante.`,
      field: 'limit',
    }
  }

  // Récupérer l'annonce et vérifier la capacité
  const { data: announcement, error: announcementError } = await supabase
    .from('announcements')
    .select(
      'id, traveler_id, available_kg, status, departure_city, arrival_city, price_per_kg'
    )
    .eq('id', formData.announcement_id)
    .single()

  if (announcementError || !announcement) {
    console.error('Announcement fetch error:', announcementError)
    console.error('Announcement ID:', formData.announcement_id)
    return {
      error: announcementError?.message || 'Annonce introuvable',
    }
  }

  // Vérifier que l'annonce est active
  if (announcement.status !== 'active') {
    return {
      error: "Cette annonce n'est plus disponible",
    }
  }

  // Vérifier que l'utilisateur n'est pas le voyageur
  if (announcement.traveler_id === user.id) {
    return {
      error: 'Vous ne pouvez pas réserver votre propre annonce',
    }
  }

  // Calculer le poids réservé actuel
  const { data: existingBookings } = await supabase
    .from('bookings')
    .select('kilos_requested, weight_kg')
    .eq('announcement_id', formData.announcement_id)
    .in('status', ['pending', 'accepted', 'in_transit'])

  const reservedWeight =
    existingBookings?.reduce(
      (sum: number, b: any) => sum + (b.kilos_requested || b.weight_kg || 0),
      0
    ) || 0
  const maxWeight = (announcement as any).available_kg || 0
  const availableWeight = Math.max(0, maxWeight - reservedWeight)

  // Vérifier la capacité disponible
  if (formData.kilos_requested > availableWeight) {
    return {
      error: `Capacité insuffisante. Il reste ${availableWeight.toFixed(1)} kg disponible(s).`,
      field: 'kilos_requested',
    }
  }

  // Validation Zod
  const validation = createBookingSchema.safeParse(formData)
  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || 'Données invalides',
      field: String(validation.error.issues[0]?.path[0] || 'unknown'),
    }
  }

  const breakdown = calculateBookingPrice(
    validation.data.kilos_requested,
    announcement.price_per_kg || 0,
    validation.data.package_value || 0,
    validation.data.insurance_opted
  )

  if (FEATURES.BETA_MODE && breakdown.total > FEATURES.MAX_BOOKING_AMOUNT) {
    return {
      error: `Montant limité à ${FEATURES.MAX_BOOKING_AMOUNT}€ pendant la beta`,
    }
  }

  try {
    // Créer la réservation
    // Le QR code sera généré automatiquement par le trigger de base de données
    const { data: booking, error: createError } = await supabase
      .from('bookings')
      .insert({
        announcement_id: validation.data.announcement_id,
        sender_id: user.id,
        traveler_id: announcement.traveler_id,
        kilos_requested: validation.data.kilos_requested,
        package_description: validation.data.package_description,
        package_value: validation.data.package_value,
        price_per_kg: announcement.price_per_kg,
        qr_code: '', // Sera remplacé automatiquement par le trigger
        insurance_opted: validation.data.insurance_opted,
        status: 'pending',
      })
      .select('id')
      .single()

    if (createError || !booking) {
      console.error('Create booking error:', createError)
      console.error(
        'Create booking error details:',
        JSON.stringify(createError, null, 2)
      )
      console.error('Booking data attempted:', {
        announcement_id: validation.data.announcement_id,
        sender_id: user.id,
        traveler_id: announcement.traveler_id,
        kilos_requested: validation.data.kilos_requested,
      })
      const errorMessage =
        createError?.message ||
        createError?.details ||
        createError?.hint ||
        'Erreur inconnue'
      return {
        error: `Erreur lors de la création de la réservation: ${errorMessage}`,
      }
    }

    // Upload des photos si fournies
    if (
      validation.data.package_photos &&
      validation.data.package_photos.length > 0
    ) {
      // Rate limiting pour uploads
      const rateLimitResult = await uploadRateLimit(user.id)
      if (!rateLimitResult.success) {
        await supabase.from('bookings').delete().eq('id', booking.id)
        return {
          error: `Trop d'uploads. Réessayez après ${rateLimitResult.reset.toLocaleTimeString('fr-FR')}`,
          field: 'package_photos',
        }
      }

      const photoUrls: string[] = []

      for (let i = 0; i < validation.data.package_photos.length; i++) {
        const photo = validation.data.package_photos[i]

        // Valider avec magic bytes
        const magicBytesValidation = await validateImageUpload(photo, 5)
        if (!magicBytesValidation.valid) {
          await supabase.from('bookings').delete().eq('id', booking.id)
          return {
            error: `Photo ${i + 1}: ${magicBytesValidation.error}`,
            field: 'package_photos',
          }
        }

        // Valider le fichier
        const photoValidation = validatePackagePhoto(photo)
        if (!photoValidation.valid) {
          // Supprimer la réservation si l'upload échoue
          await supabase.from('bookings').delete().eq('id', booking.id)
          return {
            error: photoValidation.error || 'Photo invalide',
            field: 'package_photos',
          }
        }

        // Traiter la photo
        const processedPhoto = await processPackagePhoto(photo)
        const fileName = generatePackagePhotoFileName(booking.id, i)

        // Upload vers Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('package-photos')
          .upload(fileName, processedPhoto, {
            contentType: 'image/jpeg',
            upsert: false,
          })

        if (uploadError) {
          console.error('Upload photo error:', uploadError)
          // Supprimer la réservation si l'upload échoue
          await supabase.from('bookings').delete().eq('id', booking.id)
          return {
            error: "Erreur lors de l'upload des photos",
            field: 'package_photos',
          }
        }

        // Générer URL publique
        const { data: urlData } = await supabase.storage
          .from('package-photos')
          .getPublicUrl(fileName)

        photoUrls.push(urlData.publicUrl)
      }

      // Mettre à jour la réservation avec les URLs des photos
      await supabase
        .from('bookings')
        .update({ package_photos: photoUrls } as any)
        .eq('id', booking.id)
    }

    // Créer notification et envoyer email au voyageur (ne pas bloquer si ça échoue)
    try {
      await notifyUser({
        user_id: announcement.traveler_id,
        type: 'booking_request',
        title: 'Nouvelle demande de réservation',
        content: `Une nouvelle demande de réservation a été créée pour votre trajet ${announcement.departure_city} → ${announcement.arrival_city}`,
        booking_id: booking.id,
        announcement_id: announcement.id,
        sendEmail: true,
      })
    } catch (notifError) {
      console.error('Notification/Email failed (non-blocking):', notifError)
      // Ne pas bloquer la création de la réservation si la notification ou l'email échoue
    }

    revalidatePath('/dashboard/colis')
    revalidatePath('/dashboard/messages')
    revalidatePath(`/annonces/${formData.announcement_id}`)

    console.log('✅ Booking created successfully:', booking.id)

    return {
      success: true,
      bookingId: booking.id,
      message: 'Réservation créée avec succès',
    }
  } catch (error) {
    console.error('Create booking error:', error)
    return {
      error: 'Une erreur est survenue. Veuillez réessayer.',
    }
  }
}

/**
 * Récupère les détails d'une annonce pour la réservation
 */
export async function getAnnouncementForBooking(announcementId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      error: 'Non authentifié',
    }
  }

  // Récupérer l'annonce avec les infos du voyageur
  const { data: announcement, error } = await supabase
    .from('announcements')
    .select(
      `
      id,
      traveler_id,
      departure_city,
      departure_country,
      arrival_city,
      arrival_country,
      departure_date,
      price_per_kg,
      available_kg,
      status
    `
    )
    .eq('id', announcementId)
    .single()

  if (error || !announcement) {
    return {
      error: 'Annonce introuvable',
    }
  }

  // Vérifier que l'annonce est active
  if (announcement.status !== 'active') {
    return {
      error: "Cette annonce n'est plus disponible",
    }
  }

  // Vérifier que l'utilisateur n'est pas le voyageur
  if (announcement.traveler_id === user.id) {
    return {
      error: 'Vous ne pouvez pas réserver votre propre annonce',
    }
  }

  // Calculer le poids réservé
  const { data: bookings } = await supabase
    .from('bookings')
    .select('kilos_requested, weight_kg')
    .eq('announcement_id', announcementId)
    .in('status', ['pending', 'accepted', 'in_transit'])

  const reservedWeight =
    bookings?.reduce(
      (sum: number, b: any) => sum + (b.kilos_requested || b.weight_kg || 0),
      0
    ) || 0
  const maxWeight = (announcement as any).available_kg || 0
  const availableWeight = Math.max(0, maxWeight - reservedWeight)

  const { data: publicProfiles } = await getPublicProfiles(supabase, [
    announcement.traveler_id,
  ])
  const profile = publicProfiles?.[0] || null

  return {
    announcement: {
      id: announcement.id,
      traveler_id: announcement.traveler_id,
      departure_city: announcement.departure_city,
      departure_country: announcement.departure_country,
      arrival_city: announcement.arrival_city,
      arrival_country: announcement.arrival_country,
      departure_date: announcement.departure_date,
      price_per_kg: announcement.price_per_kg || 0,
      available_kg: (announcement as any).available_kg || 0,
      available_weight: availableWeight,
      traveler_firstname: profile?.firstname || null,
      traveler_lastname: profile?.lastname || null,
      traveler_avatar_url: profile?.avatar_url || null,
    },
  }
}
