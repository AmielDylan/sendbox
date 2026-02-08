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
      'id, role, stripe_connect_account_id, stripe_payouts_enabled, stripe_onboarding_completed, payout_method, payout_status, payout_error_code, payout_error_message, payout_error_at'
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
  const payoutErrorCode = (profile as any)?.payout_error_code as
    | string
    | null
    | undefined
  const payoutErrorMessage = (profile as any)?.payout_error_message as
    | string
    | null
    | undefined
  const payoutErrorAt = (profile as any)?.payout_error_at as string | null | undefined

  const buildUpdate = (payload: Record<string, any>) => {
    const updates: Record<string, any> = {}
    for (const [key, value] of Object.entries(payload)) {
      if ((profile as any)?.[key] !== value) {
        updates[key] = value
      }
    }
    return updates
  }

  if (!profile.stripe_connect_account_id) {
    return Response.json({
      payouts_enabled: false,
      onboarding_completed: false,
      payout_status: payoutStatus ?? null,
      payout_method: payoutMethod ?? null,
      payout_error_code: payoutErrorCode ?? null,
      payout_error_message: payoutErrorMessage ?? null,
      payout_error_at: payoutErrorAt ?? null,
      requirements: null,
    })
  }

  try {
    const status = await checkAccountStatus(profile.stripe_connect_account_id)
    if (status.missing) {
      const resetPayload: Record<string, any> = {
        stripe_connect_account_id: null,
        stripe_payouts_enabled: false,
        stripe_onboarding_completed: false,
        stripe_requirements: null,
        payout_error_code: 'account_missing',
        payout_error_message: 'Compte de paiement introuvable.',
        payout_error_at: new Date().toISOString(),
      }
      if (payoutMethod === 'stripe_bank') {
        resetPayload.payout_status = 'disabled'
      }

      const updates = buildUpdate(resetPayload)
      if (Object.keys(updates).length > 0) {
        await supabase.from('profiles').update(updates).eq('id', user.id)
      }

      return Response.json({
        payouts_enabled: false,
        onboarding_completed: false,
        payout_status: resetPayload.payout_status ?? payoutStatus ?? null,
        payout_method: payoutMethod ?? null,
        payout_error_code: resetPayload.payout_error_code,
        payout_error_message: resetPayload.payout_error_message,
        payout_error_at: resetPayload.payout_error_at,
        requirements: null,
        missing_account: true,
      })
    }

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
      payout_error_code: null,
      payout_error_message: null,
      payout_error_at: null,
    }

    if (shouldUpdatePayoutMethod) {
      updatePayload.payout_method = payoutMethod || 'stripe_bank'
      updatePayload.payout_status = nextPayoutStatus
    }

    const updates = buildUpdate(updatePayload)
    if (Object.keys(updates).length > 0) {
      await supabase
        .from('profiles')
        .update(updates as any)
        .eq('id', user.id)
    }

    return Response.json({
      payouts_enabled: payoutsEnabled,
      onboarding_completed: onboardingCompleted,
      payout_status: shouldUpdatePayoutMethod ? nextPayoutStatus : payoutStatus,
      payout_method: shouldUpdatePayoutMethod
        ? updatePayload.payout_method
        : payoutMethod,
      payout_error_code: null,
      payout_error_message: null,
      payout_error_at: null,
      requirements: requirementsJson,
    })
  } catch (error) {
    const errorCode =
      (error as { code?: string })?.code || 'stripe_status_error'
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Erreur lors de la vérification du compte.'

    const updatePayload: Record<string, any> = {
      payout_error_code: errorCode,
      payout_error_message: errorMessage,
      payout_error_at: new Date().toISOString(),
    }

    if (payoutMethod === 'stripe_bank') {
      updatePayload.payout_status = 'disabled'
    }

    const updates = buildUpdate(updatePayload)
    if (Object.keys(updates).length > 0) {
      await supabase
        .from('profiles')
        .update(updates as any)
        .eq('id', user.id)
    }

    return Response.json(
      { error: errorMessage, payout_error_code: errorCode },
      { status: 502 }
    )
  }
}
