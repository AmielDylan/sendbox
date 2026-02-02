import { stripe } from '@/lib/shared/services/stripe/config'
import { createClient } from '@/lib/shared/db/server'

type ProfileConnectInfo = {
  id: string
  role: string | null
  stripe_connect_account_id: string | null
}

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { data, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, stripe_connect_account_id')
    .eq('id', user.id)
    .single()

  const profile = data as ProfileConnectInfo | null

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
    return Response.json(
      { error: 'Compte Stripe non configuré' },
      { status: 400 }
    )
  }

  const loginLink = await stripe.accounts.createLoginLink(
    profile.stripe_connect_account_id
  )

  return Response.json({ url: loginLink.url })
}
