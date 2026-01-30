import { stripe } from '@/lib/shared/services/stripe/config'
import { createClient } from '@/lib/shared/db/server'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, email, stripe_connect_account_id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return Response.json({ error: 'Profil introuvable' }, { status: 404 })
  }

  if (profile.role !== 'user') {
    return Response.json({ error: 'Accès réservé aux utilisateurs' }, { status: 403 })
  }

  let accountId = profile.stripe_connect_account_id || null

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'FR',
      email: profile.email || user.email || undefined,
      capabilities: {
        transfers: { requested: true },
      },
      business_profile: {
        name: 'Sendbox Partner',
        url: APP_URL,
      },
    })

    accountId = account.id

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ stripe_connect_account_id: accountId })
      .eq('id', user.id)

    if (updateError) {
      return Response.json(
        { error: "Impossible d'enregistrer le compte Stripe" },
        { status: 500 }
      )
    }
  }

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    type: 'account_onboarding',
    return_url: `${APP_URL}/dashboard/reglages/paiements?connect=return`,
    refresh_url: `${APP_URL}/dashboard/reglages/paiements?connect=refresh`,
  })

  return Response.json({ url: accountLink.url })
}
