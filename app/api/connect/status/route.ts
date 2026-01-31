import { createClient } from '@/lib/shared/db/server'
import type { Database } from '@/types/database.types'
import { checkAccountStatus } from '@/lib/services/stripe-connect'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(
      'id, role, stripe_connect_account_id, stripe_payouts_enabled, stripe_onboarding_completed, payout_method, payout_status'
    )
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return Response.json({ error: 'Profil introuvable' }, { status: 404 })
  }

  if (profile.role === 'admin') {
    return Response.json(
      { error: 'Accès réservé aux utilisateurs' },
      { status: 403 }
    )
  }

  const payoutMethod = (profile as any)?.payout_method as
    | 'stripe_bank'
    | 'mobile_wallet'
    | undefined
  const payoutStatus = (profile as any)?.payout_status as
    | 'pending'
    | 'active'
    | 'disabled'
    | undefined

  if (!profile.stripe_connect_account_id) {
    return Response.json({
      payouts_enabled: false,
      onboarding_completed: false,
      payout_status: payoutStatus ?? null,
      payout_method: payoutMethod ?? null,
      requirements: null,
    })
  }

  const status = await checkAccountStatus(profile.stripe_connect_account_id)
  const payoutsEnabled = Boolean(status.payoutsEnabled)
  const requirements = status.requirements || null
  const requirementsJson = requirements
    ? (JSON.parse(JSON.stringify(requirements)) as Database['public']['Tables']['profiles']['Row']['stripe_requirements'])
    : null
  const onboardingCompleted =
    payoutsEnabled &&
    !requirements?.currently_due?.length &&
    !requirements?.past_due?.length

  const shouldUpdatePayoutMethod = payoutMethod !== 'mobile_wallet'
  const nextPayoutStatus = payoutsEnabled ? 'active' : 'pending'
  const updatePayload: Record<string, any> = {
    stripe_payouts_enabled: payoutsEnabled,
    stripe_onboarding_completed: onboardingCompleted,
    stripe_requirements: requirementsJson,
  }

  if (shouldUpdatePayoutMethod) {
    updatePayload.payout_method = payoutMethod || 'stripe_bank'
    updatePayload.payout_status = nextPayoutStatus
  }

  await supabase.from('profiles').update(updatePayload as any).eq('id', user.id)

  return Response.json({
    payouts_enabled: payoutsEnabled,
    onboarding_completed: onboardingCompleted,
    payout_status: shouldUpdatePayoutMethod ? nextPayoutStatus : payoutStatus,
    payout_method: shouldUpdatePayoutMethod
      ? updatePayload.payout_method
      : payoutMethod,
    requirements: requirementsJson,
  })
}
