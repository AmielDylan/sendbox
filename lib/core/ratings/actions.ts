/**
 * Server Actions pour les ratings
 */

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from "@/lib/shared/db/server"
import { ratingSchema, type RatingInput } from "@/lib/core/ratings/validations"
import { notifyUser } from '@/lib/core/notifications/actions'

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

    const { booking_id, rating, comment } = validation.data

    // 1. Vérifier que le booking est delivered
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, status, sender_id, traveler_id')
      .eq('id', booking_id)
      .single()

    if (bookingError || !booking) {
      return {
        error: 'Réservation introuvable',
      }
    }

    if (booking.status !== 'delivered') {
      return {
        error: 'Le service doit être terminé pour pouvoir noter',
      }
    }

    // 2. Déterminer qui note qui
    const raterId = user.id
    const ratedId =
      raterId === booking.sender_id ? booking.traveler_id : booking.sender_id

    // Vérifier que l'utilisateur fait partie du booking
    if (raterId !== booking.sender_id && raterId !== booking.traveler_id) {
      return {
        error: 'Vous n\'êtes pas autorisé à noter ce service',
      }
    }

    // 3. Vérifier qu'il n'a pas déjà noté
    const { data: existing, error: existingError } = await supabase
      .from('ratings')
      .select('id')
      .eq('booking_id', booking_id)
      .eq('rater_id', raterId)
      .single()

    if (existingError && existingError.code !== 'PGRST116') {
      // PGRST116 = no rows returned (normal si pas encore noté)
      console.error('Error checking existing rating:', existingError)
      return {
        error: 'Erreur lors de la vérification',
      }
    }

    if (existing) {
      return {
        error: 'Vous avez déjà noté ce service',
      }
    }

    // 4. Insérer le rating
    const { error: insertError } = await supabase.from('ratings').insert({
      booking_id,
      rater_id: raterId,
      rated_id: ratedId,
      rating,
      comment: comment || null,
    })

    if (insertError) {
      console.error('Error inserting rating:', insertError)
      return {
        error: 'Erreur lors de l\'enregistrement du rating',
      }
    }

    // 5. Le trigger SQL met à jour automatiquement profiles.rating

    // 6. Incrémenter completed_services pour l'utilisateur noté
    const { error: incrementError } = await (supabase.rpc as any)(
      'increment_completed_services',
      {
        p_user_id: ratedId,
      }
    )

    if (incrementError) {
      console.error('Error incrementing completed services:', incrementError)
      // Ne pas bloquer si cette étape échoue
    }

    // 7. Notification à l'utilisateur noté
    await notifyUser({
      user_id: ratedId,
      type: 'rating_request', // Utiliser rating_request comme type de notification
      title: 'Nouveau avis',
      content: `Vous avez reçu un avis ${rating}⭐`,
      booking_id,
    })

    revalidatePath(`/dashboard/colis/${booking_id}`)
    revalidatePath(`/profil/${ratedId}`)

    return {
      success: true,
      message: 'Votre avis a été enregistré avec succès',
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

  const offset = (page - 1) * limit

  const { data: ratings, error } = await supabase
    .from('ratings')
    .select(
      `
      id,
      rating,
      comment,
      created_at,
      rater:rater_id (
        id,
        firstname,
        lastname,
        avatar_url
      )
    `
    )
    .eq('rated_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching ratings:', error)
    return {
      ratings: [],
      error: 'Erreur lors de la récupération des avis',
    }
  }

  // Compter le total
  const { count, error: countError } = await supabase
    .from('ratings')
    .select('*', { count: 'exact', head: true })
    .eq('rated_id', userId)

  if (countError) {
    console.error('Error counting ratings:', countError)
  }

  return {
    ratings: ratings || [],
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

  // Récupérer le rating moyen et le nombre total
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('completed_services')
    .eq('id', userId)
    .single()

  if (profileError) {
    console.error('Error fetching profile:', profileError)
  }

  const profileData = profile as any

  // Récupérer la distribution des ratings
  const { data: distribution } = await supabase
    .from('ratings')
    .select('rating')
    .eq('rated_id', userId)

  const distributionMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }

  distribution?.forEach((r) => {
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
    .select('id, status, sender_id, traveler_id')
    .eq('id', bookingId)
    .single()

  if (!booking) {
    return {
      canRate: false,
      error: 'Réservation introuvable',
    }
  }

  if (booking.status !== 'delivered') {
    return {
      canRate: false,
      error: 'Le service doit être terminé',
    }
  }

  // Vérifier si déjà noté
  const { data: existing } = await supabase
    .from('ratings')
    .select('id')
    .eq('booking_id', bookingId)
    .eq('rater_id', user.id)
    .single()

  if (existing) {
    return {
      canRate: false,
      error: 'Vous avez déjà noté ce service',
      alreadyRated: true,
    }
  }

  // Déterminer qui note qui
  const ratedId =
    user.id === booking.sender_id ? booking.traveler_id : booking.sender_id

  // Récupérer le nom de la personne à noter
  const { data: ratedUser } = await supabase
    .from('profiles')
    .select('firstname, lastname')
    .eq('id', ratedId)
    .single()

  return {
    canRate: true,
    ratedUserId: ratedId,
    ratedUserName: ratedUser
      ? `${ratedUser.firstname} ${ratedUser.lastname}`
      : 'Utilisateur',
  }
}

