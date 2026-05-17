'use server'

import { createAdminClient } from '@/lib/shared/db/admin'
import {
  checkConcentrationRatio,
  checkCollusionRing,
} from '@/lib/trust/anti-collusion'
import { computeAndSaveTrustScore } from '@/lib/trust/score'

/**
 * Scan hebdomadaire de confiance : recompute les scores et lance les
 * vérifications anti-collusion pour tous les utilisateurs actifs non suspendus.
 * Ne suspend jamais automatiquement — signale uniquement pour revue admin.
 */
export async function runWeeklyTrustScan(): Promise<{
  scanned: number
  errors: number
}> {
  const admin = createAdminClient()

  const { data: users, error } = await admin
    .from('profiles')
    .select('id')
    .eq('is_suspended', false)
    .gt('completed_count', 0)

  if (error || !users) {
    console.error('[weekly-trust-scan] Failed to fetch users:', error)
    return { scanned: 0, errors: 1 }
  }

  let errors = 0

  for (const user of users) {
    const results = await Promise.allSettled([
      computeAndSaveTrustScore(user.id),
      checkConcentrationRatio(user.id),
      checkCollusionRing(user.id),
    ])

    for (const result of results) {
      if (result.status === 'rejected') {
        console.error(
          `[weekly-trust-scan] Error for user ${user.id}:`,
          result.reason
        )
        errors++
      }
    }
  }

  return { scanned: users.length, errors }
}
