/**
 * Server Actions pour les ratings
 */

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/shared/db/server'
import { createAdminClient } from '@/lib/shared/db/admin'
import {
  filterReviewCriteriaForRole,
  formatReviewComment,
  ratingSchema,
  type RatingInput,
  type ReviewRole,
} from '@/lib/core/ratings/validations'
import {
  getPublicProfiles,
  mapPublicProfilesById,
} from '@/lib/shared/db/queries/public-profiles'
import { tryPublishBlindReviews } from '@/lib/trust/score'

/**
 * Soumet un rating pour un service terminé
 */
export async function submitRating(data: RatingInput) {
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
    // Valider les données
    const validation = ratingSchema.safeParse(data)
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors
      return {
        error: 'Erreur de validation',
        fieldErrors: errors,
      }
    }

    const { booking_id, rating, comment, criteria } = validation.data

    // 1. Vérifier que le service est terminé
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, status, sender_id, traveler_id, delivery_confirmed_at')
      .eq('id', booking_id)
      .single()

    if (bookingError || !booking) {
      return {
        error: 'Réservation introuvable',
      }
    }

    const serviceCompleted =
      Boolean(booking.delivery_confirmed_at) ||
      ['delivered', 'completed'].includes(booking.status)

    if (!serviceCompleted) {
      return {
        error: 'La livraison doit être terminée pour pouvoir noter',
      }
    }

    // 2. Déterminer qui note qui
    const raterId = user.id
    const ratedId =
      raterId === booking.sender_id ? booking.traveler_id : booking.sender_id

    // Vérifier que l'utilisateur fait partie du booking
    if (raterId !== booking.sender_id && raterId !== booking.traveler_id) {
      return {
        error: "Vous n'êtes pas autorisé à noter ce service",
      }
    }

    const reviewerRole: ReviewRole =
      raterId === booking.sender_id ? 'sender' : 'traveler'
    const allowedCriteria = filterReviewCriteriaForRole(criteria, reviewerRole)

    if (allowedCriteria.length === 0) {
      return {
        error: 'Selectionnez au moins un critere adapte a votre role',
      }
    }

    const admin = createAdminClient()

    // 3. Vérifier l'état de l'avis existant
    const { data: existing, error: existingError } = await admin
      .from('ratings')
      .select('id, status')
      .eq('booking_id', booking_id)
      .eq('rater_id', raterId)
      .maybeSingle()

    if (existingError) {
      console.error('Error checking existing rating:', existingError)
      return {
        error: 'Erreur lors de la vérification',
      }
    }

    if (existing?.status === 'published') {
      return {
        error: 'Votre avis a déjà été publié',
      }
    }

    if (existing?.status === 'submitted') {
      return {
        error:
          "Votre avis est déjà enregistré. Il sera publié lorsque l'autre partie aura aussi noté.",
      }
    }

    if (existing?.status === 'skipped') {
      return {
        error: "La fenêtre d'avis est expirée pour ce service",
      }
    }

    const now = new Date().toISOString()
    const payload = {
      rating,
      comment: formatReviewComment(comment, allowedCriteria),
      status: 'submitted' as const,
      submitted_at: now,
    }

    if (existing) {
      const { error: updateError } = await admin
        .from('ratings')
        .update(payload)
        .eq('id', existing.id)

      if (updateError) {
        console.error('Error updating rating:', updateError)
        return {
          error: "Erreur lors de l'enregistrement de l'avis",
        }
      }
    } else {
      const { error: insertError } = await admin.from('ratings').insert({
        booking_id,
        rater_id: raterId,
        rated_id: ratedId,
        ...payload,
      })

      if (insertError) {
        console.error('Error inserting rating:', insertError)
        return {
          error: "Erreur lors de l'enregistrement de l'avis",
        }
      }
    }

    await tryPublishBlindReviews(booking_id)

    const { data: savedReview } = await admin
      .from('ratings')
      .select('status')
      .eq('booking_id', booking_id)
      .eq('rater_id', raterId)
      .maybeSingle()

    revalidatePath(`/dashboard/colis/${booking_id}`)
    revalidatePath(`/profil/${ratedId}`)

    return {
      success: true,
      message:
        savedReview?.status === 'published'
          ? 'Les deux avis ont été publiés'
          : "Votre avis est enregistré. Il sera publié lorsque l'autre partie aura aussi noté.",
    }
  } catch (error) {
    console.error('Error submitting rating:', error)
    return {
      error: 'Une erreur est survenue. Veuillez réessayer.',
    }
  }
}

/**
 * Récupère les ratings d'un utilisateur
 */
export async function getUserRatings(
  userId: string,
  page: number = 1,
  limit: number = 10
) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const offset = (page - 1) * limit

  const { data: ratings, error } = await admin
    .from('ratings')
    .select(
      `
      id,
      rating,
      comment,
      created_at,
      published_at,
      rater_id
    `
    )
    .eq('rated_id', userId)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching ratings:', error)
    return {
      ratings: [],
      error: 'Erreur lors de la récupération des avis',
    }
  }

  // Compter le total
  const { count, error: countError } = await admin
    .from('ratings')
    .select('*', { count: 'exact', head: true })
    .eq('rated_id', userId)
    .eq('status', 'published')

  if (countError) {
    console.error('Error counting ratings:', countError)
  }

  const raterIds = ratings?.map((rating: any) => rating.rater_id) || []
  const { data: raterProfiles } = await getPublicProfiles(supabase, raterIds)
  const raterById = mapPublicProfilesById(raterProfiles || [])

  const enrichedRatings =
    ratings?.map((rating: any) => ({
      ...rating,
      rater: raterById[rating.rater_id] || null,
    })) || []

  return {
    ratings: enrichedRatings,
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  }
}

/**
 * Récupère les statistiques de rating d'un utilisateur
 */
export async function getUserRatingStats(userId: string) {
  const supabase = await createClient()
  const admin = createAdminClient()

  // Récupérer le rating moyen et le nombre total
  const { data: publicProfiles, error: profileError } = await getPublicProfiles(
    supabase,
    [userId]
  )

  if (profileError) {
    console.error('Error fetching profile:', profileError)
  }

  const profileData = publicProfiles?.[0] || null

  // Récupérer la distribution des ratings
  const { data: distribution } = await admin
    .from('ratings')
    .select('rating')
    .eq('rated_id', userId)
    .eq('status', 'published')

  const distributionMap: Record<number, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  }

  distribution?.forEach(r => {
    distributionMap[r.rating] = (distributionMap[r.rating] || 0) + 1
  })

  // Calculer le rating moyen depuis la distribution
  const totalRatings = distribution?.length || 0
  const sumRatings = distribution?.reduce((sum, r) => sum + r.rating, 0) || 0
  const averageRating = totalRatings > 0 ? sumRatings / totalRatings : 0

  return {
    averageRating,
    totalRatings,
    completedServices: profileData?.completed_services || 0,
    distribution: distributionMap,
  }
}

/**
 * Vérifie si un utilisateur peut noter un booking
 */
export async function canRateBooking(bookingId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      canRate: false,
      error: 'Non authentifié',
    }
  }

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, sender_id, traveler_id, delivery_confirmed_at')
    .eq('id', bookingId)
    .single()

  if (!booking) {
    return {
      canRate: false,
      error: 'Réservation introuvable',
    }
  }

  const serviceCompleted =
    Boolean(booking.delivery_confirmed_at) ||
    ['delivered', 'completed'].includes(booking.status)

  if (!serviceCompleted) {
    return {
      canRate: false,
      error: 'Le service doit être terminé',
    }
  }

  // Vérifier si déjà noté
  if (user.id !== booking.sender_id && user.id !== booking.traveler_id) {
    return {
      canRate: false,
      error: "Vous n'êtes pas autorisé à noter ce service",
    }
  }

  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('ratings')
    .select('id, status')
    .eq('booking_id', bookingId)
    .eq('rater_id', user.id)
    .maybeSingle()

  if (existing?.status === 'submitted') {
    return {
      canRate: false,
      error:
        "Votre avis est enregistré. Il sera publié lorsque l'autre partie aura aussi noté.",
      alreadyRated: true,
    }
  }

  if (existing?.status === 'published') {
    return {
      canRate: false,
      error: 'Votre avis a déjà été publié',
      alreadyRated: true,
    }
  }

  if (existing?.status === 'skipped') {
    return {
      canRate: false,
      error: "La fenêtre d'avis est expirée pour ce service",
      alreadyRated: true,
    }
  }

  // Déterminer qui note qui
  const ratedId =
    user.id === booking.sender_id ? booking.traveler_id : booking.sender_id
  const reviewerRole: ReviewRole =
    user.id === booking.sender_id ? 'sender' : 'traveler'

  // Récupérer le nom de la personne à noter
  const { data: ratedProfiles } = await getPublicProfiles(supabase, [ratedId])
  const ratedUser = ratedProfiles?.[0] || null

  return {
    canRate: true,
    reviewerRole,
    ratedUserId: ratedId,
    ratedUserName: ratedUser
      ? `${ratedUser.firstname} ${ratedUser.lastname}`
      : 'Utilisateur',
  }
}
