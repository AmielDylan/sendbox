import { createClient } from '@/lib/shared/db/server'
import {
  createAccountSession,
  createConnectedAccount,
} from '@/lib/services/stripe-connect'
import { isStripeAccountMissing } from '@/lib/services/stripe-connect'
import { stripe } from '@/lib/shared/services/stripe/config'
import {
  getStripeConnectAllowedCountries,
  resolveStripeConnectCountry,
} from '@/lib/shared/stripe/connect-allowed'

type OnboardRequestBody = {
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

const normalizeWebsite = (value?: string) => {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const withScheme = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`
  try {
    const url = new URL(withScheme)
    if (!url.hostname.includes('.')) return null
    return url.toString()
  } catch {
    return null
  }
}

const isPublicUrl = (value: string | null) => {
  if (!value) return false
  try {
    const url = new URL(value)
    const host = url.hostname.toLowerCase()
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
      return false
    }
    if (host.endsWith('.local')) return false
    return url.protocol === 'https:'
  } catch {
    return false
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
      .select(
        'id, role, email, stripe_connect_account_id, firstname, lastname, phone, address, city, postal_code, birthday, country'
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

    const body = await req
      .json()
      .catch(() => ({} as OnboardRequestBody))

    const bank = body?.bankData || {}
    if (!bank?.accountHolder?.trim() || !bank?.iban?.trim()) {
      return Response.json(
        { error: 'Informations bancaires requises' },
        { status: 400 }
      )
    }

    const allowedCountries = getStripeConnectAllowedCountries()
    const country = resolveStripeConnectCountry(
      profile.country,
      allowedCountries
    )

    if (!country) {
      return Response.json(
        {
          error:
            "Pays de vérification manquant. Relancez la vérification d'identité.",
        },
        { status: 400 }
      )
    }
    const reqOrigin = req.headers.get('origin')
    const reqHost =
      req.headers.get('x-forwarded-host') || req.headers.get('host')
    const reqProto = req.headers.get('x-forwarded-proto') || 'http'
    const baseUrl =
      reqOrigin || (reqHost ? `${reqProto}://${reqHost}` : null)
    const defaultProfileUrl = baseUrl
      ? `${baseUrl.replace(/\/$/, '')}/profil/${user.id}`
      : null
    const envProfileUrl = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')}/profil/${user.id}`
      : null
    const sendboxFallbackUrl = `https://www.gosendbox.com/profil/${user.id}`

    const preferredUrl =
      normalizeWebsite(envProfileUrl || undefined) ||
      normalizeWebsite(defaultProfileUrl || undefined) ||
      normalizeWebsite(sendboxFallbackUrl)

    const businessWebsite = isPublicUrl(preferredUrl)
      ? preferredUrl
      : normalizeWebsite(sendboxFallbackUrl)

    const individual: Record<string, any> = {}
    if (profile.firstname?.trim()) {
      individual.first_name = profile.firstname.trim()
    }
    if (profile.lastname?.trim()) {
      individual.last_name = profile.lastname.trim()
    }
    if (profile.email?.trim()) individual.email = profile.email.trim()
    if (profile.phone?.trim()) individual.phone = profile.phone.trim()

    const dob = parseDob(profile.birthday || undefined)
    if (dob) {
      individual.dob = dob
    }

    if (
      profile.address?.trim() ||
      profile.city?.trim() ||
      profile.postal_code?.trim()
    ) {
      individual.address = {
        line1: profile.address?.trim() || undefined,
        city: profile.city?.trim() || undefined,
        postal_code: profile.postal_code?.trim() || undefined,
        country,
      }
    }

    const accountTokenData = {
      business_type: 'individual' as const,
      individual: Object.keys(individual).length > 0 ? individual : undefined,
      tos_shown_and_accepted: true,
    }

    let accountId = profile.stripe_connect_account_id || null
    const accountEmail = profile.email || user.email

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
          { error: "Impossible d'enregistrer le compte de paiement" },
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
              { error: "Impossible d'actualiser le compte de paiement" },
              { status: 500 }
            )
          }
        }
      } catch (error) {
        if (isStripeAccountMissing(error)) {
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
              { error: "Impossible d'actualiser le compte de paiement" },
              { status: 500 }
            )
          }
        } else {
          console.error('Stripe account fetch error:', error)
          return Response.json(
          { error: "Impossible d'accéder au compte de paiement" },
            { status: 500 }
          )
        }
      }
    }

    if (!accountId) {
      return Response.json(
        { error: "Impossible d'initialiser le compte de paiement" },
        { status: 500 }
      )
    }

    if (Object.keys(individual).length > 0) {
      try {
        const accountToken = await stripe.tokens.create({
          account: {
            business_type: 'individual',
            individual,
            tos_shown_and_accepted: true,
          },
        })

        await stripe.accounts.update(accountId, {
          account_token: accountToken.id,
        })
      } catch (error) {
        console.error('Stripe account update error:', error)
        return Response.json(
          { error: 'Informations invalides. Vérifiez le formulaire.' },
          { status: 400 }
        )
      }
    }

    if (businessWebsite) {
      try {
        await stripe.accounts.update(accountId, {
          business_profile: { url: businessWebsite },
        })
      } catch (error) {
        console.error('Stripe business profile error:', error)
        return Response.json(
          { error: "Impossible de démarrer la vérification." },
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
      { error: "Impossible de démarrer la vérification" },
      { status: 500 }
    )
  }
}
