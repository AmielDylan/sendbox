import { createClient } from '@/lib/shared/db/server'
import { stripe } from '@/lib/shared/services/stripe/config'
import { isStripeAccountMissing } from '@/lib/services/stripe-connect'

const pickPersonId = async (accountId: string) => {
  const account = await stripe.accounts.retrieve(accountId)
  if (account.individual?.id) {
    return { account, personId: account.individual.id }
  }

  const persons = await stripe.accounts.listPersons(accountId, { limit: 10 })
  const representative = persons.data.find(
    person => person.relationship?.representative
  )
  const personId = representative?.id || persons.data[0]?.id || null

  return { account, personId }
}

export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, stripe_connect_account_id')
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
      return Response.json(
        { error: 'Compte Stripe introuvable' },
        { status: 400 }
      )
    }

    const accountId = profile.stripe_connect_account_id

    let accountData: { account: any; personId: string | null }
    try {
      accountData = await pickPersonId(accountId)
    } catch (error) {
      if (isStripeAccountMissing(error)) {
        await supabase
          .from('profiles')
          .update({
            stripe_connect_account_id: null,
            stripe_payouts_enabled: false,
            stripe_onboarding_completed: false,
            stripe_requirements: null,
            payout_status: 'disabled',
          } as any)
          .eq('id', user.id)

        return Response.json(
          { error: 'Compte Stripe supprimé. Relancez la vérification.' },
          { status: 400 }
        )
      }
      throw error
    }

    const { account, personId } = accountData

    if (!personId) {
      return Response.json(
        { error: "Impossible d'identifier la personne à vérifier" },
        { status: 400 }
      )
    }

    const session = await stripe.identity.verificationSessions.create({
      type: 'document',
      related_person: {
        account: account.id,
        person: personId,
      },
      metadata: {
        user_id: user.id,
        stripe_account_id: account.id,
        stripe_person_id: personId,
      },
    })

    if (!session.client_secret) {
      return Response.json(
        { error: 'Client secret indisponible' },
        { status: 500 }
      )
    }

    return Response.json({
      client_secret: session.client_secret,
      session_id: session.id,
    })
  } catch (error) {
    console.error('Stripe identity session error:', error)
    return Response.json(
      { error: 'Impossible de démarrer la vérification Stripe' },
      { status: 500 }
    )
  }
}
