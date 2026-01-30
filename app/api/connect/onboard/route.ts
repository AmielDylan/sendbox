import { stripe } from '@/lib/shared/services/stripe/config'
import { createClient } from '@/lib/shared/db/server'

const RAW_APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const APP_URL = RAW_APP_URL.trim().startsWith('http')
  ? RAW_APP_URL.trim()
  : `https://${RAW_APP_URL.trim()}`
const SAFE_APP_URL = (() => {
  try {
    return new URL(APP_URL).toString()
  } catch {
    return 'http://localhost:3000'
  }
})()
const BUSINESS_PROFILE_URL = (() => {
  try {
    const parsed = new URL(APP_URL)
    if (parsed.protocol !== 'https:') {
      return null
    }
    const hostname = parsed.hostname.toLowerCase()
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.endsWith('.local')
    ) {
      return null
    }
    if (!hostname.includes('.')) {
      return null
    }
    if (parsed.port) {
      return null
    }
    return parsed.toString()
  } catch {
    return null
  }
})()

export async function POST(req: Request) {
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

  if (profile.role === 'admin') {
    return Response.json(
      { error: 'Accès réservé aux utilisateurs' },
      { status: 403 }
    )
  }

  const body = await req.json().catch(() => ({} as { country?: string }))
  const country = body?.country === 'BJ' ? 'BJ' : 'FR'

  let accountId = profile.stripe_connect_account_id || null

  try {
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country,
        email: profile.email || user.email || undefined,
        capabilities: {
          transfers: { requested: true },
        },
        business_profile: {
          name: 'Sendbox Partner',
          ...(BUSINESS_PROFILE_URL ? { url: BUSINESS_PROFILE_URL } : {}),
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

    const accountSession = await stripe.accountSessions.create({
      account: accountId,
      components: {
        account_onboarding: {
          enabled: true,
        },
      },
    })

    return Response.json({ client_secret: accountSession.client_secret })
  } catch (error) {
    console.error('Stripe connect onboarding error:', error)
    return Response.json(
      { error: "Impossible de démarrer l'onboarding Stripe" },
      { status: 500 }
    )
  }
}
