import { createClient } from '@/lib/shared/db/server'
import {
  createAccountLink,
  createConnectedAccount,
  type ConnectCountry,
} from '@/lib/services/stripe-connect'

type OnboardRequestBody = {
  country?: string
  consentAccepted?: boolean
  personalData?: {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    dob?: string
    address?: string
    city?: string
    postalCode?: string
  }
  bankData?: {
    accountHolder?: string
    iban?: string
    bic?: string
  }
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

    const body = await req
      .json()
      .catch(() => ({} as OnboardRequestBody))

    if (!body?.consentAccepted) {
      return Response.json(
        { error: 'Vous devez confirmer l\'exactitude des informations' },
        { status: 400 }
      )
    }

    const country: ConnectCountry = body?.country === 'BJ' ? 'BJ' : 'FR'
    const personal = body?.personalData || {}

    const updates: Record<string, string> = {}
    if (personal.firstName?.trim()) updates.firstname = personal.firstName.trim()
    if (personal.lastName?.trim()) updates.lastname = personal.lastName.trim()
    if (personal.phone?.trim()) updates.phone = personal.phone.trim()
    if (personal.address?.trim()) updates.address = personal.address.trim()
    if (personal.dob?.trim()) updates.birthday = personal.dob.trim()
    if (country) updates.country = country

    if (Object.keys(updates).length > 0) {
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

      if (updateProfileError) {
        return Response.json(
          { error: 'Impossible de mettre à jour le profil' },
          { status: 500 }
        )
      }
    }

    let accountId = profile.stripe_connect_account_id || null
    const accountEmail = personal.email?.trim() || profile.email || user.email

    if (!accountId) {
      accountId = await createConnectedAccount(user.id, accountEmail, country)

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

    const link = await createAccountLink(accountId)

    return Response.json({ url: link.url })
  } catch (error) {
    console.error('Stripe connect onboarding error:', error)
    return Response.json(
      { error: "Impossible de démarrer l'onboarding Stripe" },
      { status: 500 }
    )
  }
}
