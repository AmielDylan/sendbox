'use server'

import { expireStaleReviews } from '@/lib/trust/score'

/**
 * Job quotidien : expire les fenêtres d'avis non soumises
 * après REVIEW_WINDOW_DAYS depuis completed_at du booking.
 */
export async function runDailyReviewExpiry(): Promise<{ success: boolean }> {
  try {
    await expireStaleReviews()
    return { success: true }
  } catch (err) {
    console.error('[daily-review-expiry] Failed:', err)
    return { success: false }
  }
}
