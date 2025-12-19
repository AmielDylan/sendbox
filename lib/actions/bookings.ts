/**
 * Server Actions pour les réservations
 */

'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  createBookingSchema,
  type CreateBookingInput,
} from '@/lib/validations/booking'
import {
  generatePackagePhotoFileName,
  validatePackagePhoto,
} from '@/lib/utils/package-photos'
import { validateImageUpload } from '@/lib/security/upload-validation'
import { uploadRateLimit } from '@/lib/security/rate-limit'
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
export async function createBooking(formData: CreateBookingInput & {
  package_photos?: File[]
}) {
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
    .select('kyc_status')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return {
      error: 'Profil introuvable',
    }
  }

  // Vérifier que le KYC est approuvé
  if (profile.kyc_status !== 'approved') {
    return {
      error:
        'Vous devez avoir un KYC approuvé pour créer une réservation. Veuillez compléter votre vérification d\'identité.',
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
    .select('id, traveler_id, max_weight_kg, status, origin_city, destination_city')
    .eq('id', formData.announcement_id)
    .single()

  if (announcementError || !announcement) {
    return {
      error: 'Annonce introuvable',
    }
  }

  // Vérifier que l'annonce est active
  if (announcement.status !== 'active') {
    return {
      error: 'Cette annonce n\'est plus disponible',
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
    .select('weight_kg')
    .eq('announcement_id', formData.announcement_id)
    .in('status', ['pending', 'confirmed', 'in_transit'])

  const reservedWeight =
    existingBookings?.reduce((sum, b) => sum + (b.weight_kg || 0), 0) || 0
  const availableWeight = announcement.max_weight_kg - reservedWeight

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

  try {
    // Créer la réservation
    const { data: booking, error: createError } = await supabase
      .from('bookings')
      .insert({
        announcement_id: validation.data.announcement_id,
        sender_id: user.id,
        traveler_id: announcement.traveler_id,
        weight_kg: validation.data.kilos_requested,
        description: validation.data.package_description,
        package_value: validation.data.package_value,
        insurance_opted: validation.data.insurance_opted,
        status: 'pending',
      })
      .select('id')
      .single()

    if (createError || !booking) {
      console.error('Create booking error:', createError)
      return {
        error: 'Erreur lors de la création de la réservation',
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
            error: 'Erreur lors de l\'upload des photos',
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

    // Créer notification pour le voyageur
    await (supabase.rpc as any)('create_notification', {
      p_user_id: announcement.traveler_id,
      p_type: 'booking_request',
      p_title: 'Nouvelle demande de réservation',
      p_content: `Une nouvelle demande de réservation a été créée pour votre trajet ${announcement.origin_city} → ${announcement.destination_city}`,
      p_booking_id: booking.id,
      p_announcement_id: announcement.id,
    })

    revalidatePath('/dashboard/colis')
    revalidatePath('/dashboard/messages')
    revalidatePath(`/annonces/${formData.announcement_id}`)

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
      *,
      profiles:traveler_id (
        first_name,
        last_name,
        avatar_url,
        kyc_status
      )
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
      error: 'Cette annonce n\'est plus disponible',
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
    .select('weight_kg')
    .eq('announcement_id', announcementId)
    .in('status', ['pending', 'confirmed', 'in_transit'])

  const reservedWeight =
    bookings?.reduce((sum, b) => sum + (b.weight_kg || 0), 0) || 0
  const availableWeight = announcement.max_weight_kg - reservedWeight

  const profile = announcement.profiles as any

  return {
    announcement: {
      id: announcement.id,
      origin_city: announcement.origin_city,
      origin_country: announcement.origin_country,
      destination_city: announcement.destination_city,
      destination_country: announcement.destination_country,
      departure_date: announcement.departure_date,
      price_per_kg: announcement.price_per_kg,
      max_weight_kg: announcement.max_weight_kg,
      available_weight: availableWeight,
      traveler_first_name: profile?.first_name || null,
      traveler_last_name: profile?.last_name || null,
      traveler_avatar_url: profile?.avatar_url || null,
    },
  }
}

