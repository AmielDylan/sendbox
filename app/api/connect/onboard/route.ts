import { createClient } from '@/lib/shared/db/server'
import {
  createAccountSession,
  createConnectedAccount,
  type ConnectCountry,
} from '@/lib/services/stripe-connect'
import { stripe } from '@/lib/shared/services/stripe/config'

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

const parseDob = (value?: string) => {
  if (!value) return null
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return null
  const [, year, month, day] = match
  return {
    day: Number(day),
    month: Number(month),
    year: Number(year),
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
    const bank = body?.bankData || {}

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
        console.error('Profile update error:', updateProfileError)
        return Response.json(
          {
            error: 'Impossible de mettre à jour le profil',
            details: updateProfileError.message,
          },
          { status: 500 }
        )
      }
    }

    const individual: Record<string, any> = {}
    if (personal.firstName?.trim()) {
      individual.first_name = personal.firstName.trim()
    }
    if (personal.lastName?.trim()) {
      individual.last_name = personal.lastName.trim()
    }
    if (personal.email?.trim()) individual.email = personal.email.trim()
    if (personal.phone?.trim()) individual.phone = personal.phone.trim()

    const dob = parseDob(personal.dob)
    if (dob) {
      individual.dob = dob
    }

    if (
      personal.address?.trim() ||
      personal.city?.trim() ||
      personal.postalCode?.trim()
    ) {
      individual.address = {
        line1: personal.address?.trim() || undefined,
        city: personal.city?.trim() || undefined,
        postal_code: personal.postalCode?.trim() || undefined,
        country,
      }
    }

    const accountTokenData = {
      business_type: 'individual' as const,
      individual: Object.keys(individual).length > 0 ? individual : undefined,
      tos_shown_and_accepted: true,
    }

    let accountId = profile.stripe_connect_account_id || null
    const accountEmail = personal.email?.trim() || profile.email || user.email

    if (!accountId) {
      accountId = await createConnectedAccount(
        user.id,
        accountEmail,
        country,
        accountTokenData
      )

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

    if (accountId) {
      try {
        const existingAccount = await stripe.accounts.retrieve(accountId)
        if (existingAccount.type !== 'custom') {
          const newAccountId = await createConnectedAccount(
            user.id,
            accountEmail,
            country,
            accountTokenData
          )
          accountId = newAccountId

          const { error: replaceError } = await supabase
            .from('profiles')
            .update({ stripe_connect_account_id: newAccountId })
            .eq('id', user.id)

          if (replaceError) {
            return Response.json(
              { error: "Impossible d'actualiser le compte Stripe" },
              { status: 500 }
            )
          }
        }
      } catch (error) {
        console.error('Stripe account fetch error:', error)
        return Response.json(
          { error: "Impossible d'accéder au compte Stripe" },
          { status: 500 }
        )
      }
    }

    if (!accountId) {
      return Response.json(
        { error: "Impossible d'initialiser le compte Stripe" },
        { status: 500 }
      )
    }

    if (Object.keys(individual).length > 0) {
      try {
        await stripe.accounts.update(accountId, {
          individual,
        })
      } catch (error) {
        console.error('Stripe account update error:', error)
        return Response.json(
          { error: 'Informations Stripe invalides. Vérifiez le formulaire.' },
          { status: 400 }
        )
      }
    }

    if (country === 'FR' && bank?.iban?.trim() && bank?.accountHolder?.trim()) {
      const iban = bank.iban.replace(/\s/g, '').toUpperCase()
      try {
        await stripe.accounts.createExternalAccount(accountId, {
          external_account: {
            object: 'bank_account',
            country: 'FR',
            currency: 'eur',
            account_holder_name: bank.accountHolder.trim(),
            account_holder_type: 'individual',
            account_number: iban,
          },
        })
      } catch (error) {
        console.warn('Stripe external account error:', error)
      }
    }

    const { error: payoutUpdateError } = await supabase
      .from('profiles')
      .update({
        payout_method: 'stripe_bank',
        payout_status: 'pending',
        wallet_operator: null,
        wallet_phone: null,
        wallet_verified_at: null,
        wallet_otp_code: null,
        wallet_otp_expires_at: null,
        stripe_payouts_enabled: false,
        stripe_onboarding_completed: false,
      } as any)
      .eq('id', user.id)

    if (payoutUpdateError) {
      return Response.json(
        { error: 'Impossible de mettre à jour le mode de paiement' },
        { status: 500 }
      )
    }

    const session = await createAccountSession(accountId)

    return Response.json({ client_secret: session.client_secret })
  } catch (error) {
    console.error('Stripe connect onboarding error:', error)
    return Response.json(
      { error: "Impossible de démarrer l'onboarding Stripe" },
      { status: 500 }
    )
  }
}
