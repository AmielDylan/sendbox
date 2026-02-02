import { createClient } from '@/lib/shared/db/server'
import { createIdentityVerificationSession } from '@/lib/shared/services/stripe/identity'
import {
  getAccountRepresentative,
  isStripeAccountMissing,
} from '@/lib/services/stripe-connect'

type IdentityRequestBody = {
  documentType?: 'passport' | 'national_id'
  documentCountry?: string
}

export async function POST(req: Request) {
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
        { error: 'Compte de paiement introuvable' },
        { status: 400 }
      )
    }

    const accountId = profile.stripe_connect_account_id

    const body = (await req.json().catch(() => null)) as
      | IdentityRequestBody
      | null

    let accountData: { account: any; personId: string | null }
    try {
      accountData = await getAccountRepresentative(accountId)
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
          { error: 'Compte de paiement supprimé. Relancez la vérification.' },
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

    const session = await createIdentityVerificationSession({
      email: user.email,
      userId: user.id,
      documentType: body?.documentType || 'passport',
      documentCountry: body?.documentCountry || 'FR',
      relatedPerson: {
        accountId: account.id,
        personId,
      },
    })

    if (!session.clientSecret) {
      return Response.json(
        { error: 'Client secret indisponible' },
        { status: 500 }
      )
    }

    return Response.json({
      client_secret: session.clientSecret,
      session_id: session.id,
    })
  } catch (error) {
    console.error('Stripe identity session error:', error)
    return Response.json(
      { error: 'Impossible de démarrer la vérification' },
      { status: 500 }
    )
  }
}
