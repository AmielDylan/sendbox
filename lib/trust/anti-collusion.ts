'use server'

import { createAdminClient } from '@/lib/shared/db/admin'

const CONCENTRATION_FLAG_RATIO_LOW = parseFloat(
  process.env.CONCENTRATION_FLAG_RATIO_LOW || '0.60'
)
const CONCENTRATION_FLAG_RATIO_HIGH = parseFloat(
  process.env.CONCENTRATION_FLAG_RATIO_HIGH || '0.75'
)
const CONCENTRATION_MIN_TRANSACTIONS = parseInt(
  process.env.CONCENTRATION_MIN_TRANSACTIONS || '5',
  10
)
const COLLUSION_RING_DEPTH = parseInt(process.env.COLLUSION_RING_DEPTH || '3', 10)

type FlagReason = 'concentration_ratio' | 'duration_too_short' | 'ring_collusion'

async function flagExists(userId: string, reason: FlagReason): Promise<boolean> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('user_flags')
    .select('id')
    .eq('user_id', userId)
    .eq('reason', reason)
    .is('resolved_at', null)
    .maybeSingle()
  return Boolean(data)
}

async function createFlag(
  userId: string,
  reason: FlagReason,
  detail?: string
): Promise<void> {
  const admin = createAdminClient()
  await admin.from('user_flags').insert({ user_id: userId, reason, detail })
}

async function flagBooking(bookingId: string, reason: string): Promise<void> {
  const admin = createAdminClient()
  await admin
    .from('bookings')
    .update({ is_flagged: true, flag_reason: reason })
    .eq('id', bookingId)
}

/**
 * Vérifie le ratio de concentration des transactions pour un voyageur.
 * Un ratio élevé (>60% ou >75% selon volume) indique un réseau fermé suspect.
 */
export async function checkConcentrationRatio(travelerId: string): Promise<void> {
  const admin = createAdminClient()

  const { data: bookings } = await admin
    .from('bookings')
    .select('sender_id')
    .eq('traveler_id', travelerId)
    .eq('status', 'completed')

  if (!bookings || bookings.length < CONCENTRATION_MIN_TRANSACTIONS) return

  const total = bookings.length
  const countBySender: Record<string, number> = {}
  for (const b of bookings) {
    countBySender[b.sender_id] = (countBySender[b.sender_id] || 0) + 1
  }

  const maxCount = Math.max(...Object.values(countBySender))
  const ratio = maxCount / total

  const threshold =
    total >= 15 ? CONCENTRATION_FLAG_RATIO_HIGH : CONCENTRATION_FLAG_RATIO_LOW

  if (ratio >= threshold) {
    const alreadyFlagged = await flagExists(travelerId, 'concentration_ratio')
    if (!alreadyFlagged) {
      await createFlag(
        travelerId,
        'concentration_ratio',
        `ratio=${ratio.toFixed(2)} threshold=${threshold} total=${total}`
      )
    }
  }
}

/**
 * Vérifie que la durée d'une transaction respecte le minimum corridor.
 * Une durée trop courte (< seuil) indique une transaction fictive.
 */
export async function checkTransactionDuration(
  bookingId: string,
  durationHours: number
): Promise<void> {
  const minHours = parseFloat(
    process.env.TRANSACTION_MIN_DURATION_HOURS || '24'
  )

  if (durationHours < minHours) {
    await flagBooking(
      bookingId,
      `duration_too_short: ${durationHours.toFixed(1)}h < ${minHours}h`
    )

    const admin = createAdminClient()
    const { data: booking } = await admin
      .from('bookings')
      .select('traveler_id')
      .eq('id', bookingId)
      .single()

    if (booking?.traveler_id) {
      const alreadyFlagged = await flagExists(
        booking.traveler_id,
        'duration_too_short'
      )
      if (!alreadyFlagged) {
        await createFlag(
          booking.traveler_id,
          'duration_too_short',
          `booking=${bookingId} duration=${durationHours.toFixed(1)}h`
        )
      }
    }
  }
}

/**
 * Détecte les anneaux de collusion via la fonction PostgreSQL récursive.
 * Ne suspend jamais automatiquement — signale uniquement pour revue admin.
 */
export async function checkCollusionRing(userId: string): Promise<void> {
  const admin = createAdminClient()

  const { data, error } = await admin.rpc('detect_review_ring', {
    p_user_id: userId,
    p_depth: COLLUSION_RING_DEPTH,
  })

  if (error) {
    console.error('detect_review_ring error:', error)
    return
  }

  if (data === true) {
    const alreadyFlagged = await flagExists(userId, 'ring_collusion')
    if (!alreadyFlagged) {
      await createFlag(
        userId,
        'ring_collusion',
        `depth=${COLLUSION_RING_DEPTH}`
      )
    }
  }
}

/**
 * Lance l'ensemble des vérifications anti-collusion pour un booking complété.
 * Appelé en background après chaque transition vers 'completed'.
 */
export async function runAntiCollusionChecks(
  bookingId: string,
  travelerId: string,
  durationHours: number
): Promise<void> {
  await Promise.allSettled([
    checkConcentrationRatio(travelerId),
    checkTransactionDuration(bookingId, durationHours),
    checkCollusionRing(travelerId),
  ])
}
