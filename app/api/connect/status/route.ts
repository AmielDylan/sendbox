import { stripe } from '@/lib/shared/services/stripe/config'
import { createClient } from '@/lib/shared/db/server'

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
      'id, role, stripe_connect_account_id, stripe_payouts_enabled, stripe_onboarding_completed'
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

  if (!profile.stripe_connect_account_id) {
    return Response.json({
      payouts_enabled: false,
      onboarding_completed: false,
      requirements: null,
    })
  }

  const account = await stripe.accounts.retrieve(profile.stripe_connect_account_id)
  const payoutsEnabled = Boolean(account.payouts_enabled)
  const requirements = account.requirements || null
  const onboardingCompleted =
    payoutsEnabled &&
    !requirements?.currently_due?.length &&
    !requirements?.past_due?.length

  await supabase
    .from('profiles')
    .update({
      stripe_payouts_enabled: payoutsEnabled,
      stripe_onboarding_completed: onboardingCompleted,
      stripe_requirements: requirements,
    })
    .eq('id', user.id)

  return Response.json({
    payouts_enabled: payoutsEnabled,
    onboarding_completed: onboardingCompleted,
    requirements,
  })
}
