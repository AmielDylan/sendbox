'use server'

import { createAdminClient } from '@/lib/shared/db/admin'

const CAP_PER_AUTHOR = parseFloat(process.env.CAP_PER_AUTHOR || '0.20')
const REVIEW_WINDOW_DAYS = parseInt(process.env.REVIEW_WINDOW_DAYS || '7', 10)
const TEMPORAL_DECAY = 0.85

/**
 * Calcule et persiste le trust score d'un utilisateur.
 *
 * Algorithme :
 * - Les avis sont triés du plus récent au plus ancien (decay × rank)
 * - Chaque auteur est plafonné à CAP_PER_AUTHOR de la contribution totale
 * - Un malus de dispute est appliqué (-0.5 par litige ouvert)
 * - Diversité = bonus si unique_sender_count ou unique_traveler_count > 3
 */
export async function computeAndSaveTrustScore(userId: string): Promise<void> {
  const admin = createAdminClient()

  // Récupérer tous les avis publiés
  const { data: ratings } = await admin
    .from('ratings')
    .select('rating, rater_id, published_at')
    .eq('rated_id', userId)
    .eq('status', 'published')

  if (!ratings || ratings.length === 0) {
    await admin
      .from('profiles')
      .update({ trust_score: 0, completed_count: 0 })
      .eq('id', userId)
    return
  }

  // Trier du plus récent au plus ancien
  const sorted = [...ratings].sort((a, b) => {
    const dateA = a.published_at ? new Date(a.published_at).getTime() : 0
    const dateB = b.published_at ? new Date(b.published_at).getTime() : 0
    return dateB - dateA
  })

  // Compter les avis par auteur pour le cap
  const countByAuthor: Record<string, number> = {}
  for (const r of sorted) {
    countByAuthor[r.rater_id] = (countByAuthor[r.rater_id] || 0) + 1
  }
  const totalRatings = sorted.length
  const capCountByAuthor: Record<string, number> = {}

  // Calculer le score avec decay temporel et cap par auteur
  let weightedSum = 0
  let totalWeight = 0

  for (let i = 0; i < sorted.length; i++) {
    const r = sorted[i]
    const decay = Math.pow(TEMPORAL_DECAY, i)

    // Plafond par auteur : max CAP_PER_AUTHOR * totalRatings avis par auteur
    const maxFromAuthor = Math.ceil(CAP_PER_AUTHOR * totalRatings)
    capCountByAuthor[r.rater_id] = (capCountByAuthor[r.rater_id] || 0) + 1
    if (capCountByAuthor[r.rater_id] > maxFromAuthor) continue

    weightedSum += r.rating * decay
    totalWeight += decay
  }

  let score = totalWeight > 0 ? weightedSum / totalWeight : 0

  // Malus dispute : récupérer les litiges ouverts
  const { count: openDisputes } = await admin
    .from('disputes')
    .select('id', { count: 'exact', head: true })
    .or(`sender_id.eq.${userId},traveler_id.eq.${userId}`)
    .in('status', ['open', 'under_review'])

  if (openDisputes && openDisputes > 0) {
    score = Math.max(0, score - openDisputes * 0.5)
  }

  // Bonus diversité (≥ 3 expéditeurs ou voyageurs uniques → +0.1)
  const { data: profile } = await admin
    .from('profiles')
    .select('unique_sender_count, unique_traveler_count')
    .eq('id', userId)
    .single()

  if (
    (profile?.unique_sender_count ?? 0) >= 3 ||
    (profile?.unique_traveler_count ?? 0) >= 3
  ) {
    score = Math.min(5, score + 0.1)
  }

  // Arrondir à 2 décimales
  const finalScore = Math.round(score * 100) / 100

  // Compter les transactions complétées
  const { count: completedCount } = await admin
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .or(`sender_id.eq.${userId},traveler_id.eq.${userId}`)
    .eq('status', 'completed')

  await admin
    .from('profiles')
    .update({
      trust_score: finalScore,
      completed_count: completedCount ?? 0,
    })
    .eq('id', userId)
}

/**
 * Publie simultanément les deux avis en aveugle d'un booking
 * dès que les deux parties ont soumis.
 * RÈGLE D'IMMUTABILITÉ : les avis publiés ne peuvent jamais être modifiés.
 */
export async function tryPublishBlindReviews(bookingId: string): Promise<void> {
  const admin = createAdminClient()

  const { data: reviews } = await admin
    .from('ratings')
    .select('id, rater_id, rated_id, status')
    .eq('booking_id', bookingId)
    .in('status', ['submitted', 'published'])

  if (!reviews || reviews.length < 2) return

  const submitted = reviews.filter(r => r.status === 'submitted')
  if (submitted.length < 2) return

  // Les deux ont soumis — publier simultanément
  const now = new Date().toISOString()
  const ids = submitted.map(r => r.id)

  await admin
    .from('ratings')
    .update({ status: 'published', published_at: now })
    .in('id', ids)

  // Recalculer les scores des deux parties
  const userIds = [...new Set(submitted.map(r => r.rated_id))]
  await Promise.allSettled(userIds.map(id => computeAndSaveTrustScore(id)))
}

/**
 * Expire les fenêtres d'avis non soumises (REVIEW_WINDOW_DAYS après completed_at).
 * Appelé par le job daily-review-expiry.
 */
export async function expireStaleReviews(): Promise<void> {
  const admin = createAdminClient()

  const cutoff = new Date(
    Date.now() - REVIEW_WINDOW_DAYS * 24 * 60 * 60 * 1000
  ).toISOString()

  // Trouver les bookings complétés avant la fenêtre sans avis publiés
  const { data: expiredBookings } = await admin
    .from('bookings')
    .select('id')
    .eq('status', 'completed')
    .lt('completed_at', cutoff)

  if (!expiredBookings || expiredBookings.length === 0) return

  const bookingIds = expiredBookings.map(b => b.id)

  // Marquer les avis pending de ces bookings comme skipped
  await admin
    .from('ratings')
    .update({ status: 'skipped' })
    .in('booking_id', bookingIds)
    .eq('status', 'pending')
}
