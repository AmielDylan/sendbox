export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'inactive'

export interface SubscriptionInfo {
  status: SubscriptionStatus
  trial_ends_at: string | null
  trial_days_remaining: number | null
  can_publish: boolean
}

export function checkCanPublish(
  status: SubscriptionStatus,
  trialEndsAt: string | null
): boolean {
  if (status === 'active') return true
  if (
    status === 'trialing' &&
    trialEndsAt &&
    new Date(trialEndsAt) > new Date()
  )
    return true
  return false
}
