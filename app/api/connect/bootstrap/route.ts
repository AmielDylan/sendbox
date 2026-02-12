import { createClient } from '@/lib/shared/db/server'
import {
  createConnectedAccount,
  checkAccountStatus,
  getAccountRepresentative,
  isStripeAccountMissing,
  type AccountTokenData,
} from '@/lib/services/stripe-connect'
import {
  getStripeConnectAllowedCountries,
  getStripeConnectFallbackCountry,
  resolveStripeConnectCountry,
} from '@/lib/shared/stripe/connect-allowed'
import { isResidenceCountry } from '@/lib/shared/kyc/residence-countries'

const parseDob = (value?: string | null) => {
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
      .select(
        'id, role, email, payout_provider, firstname, lastname, phone, address, city, postal_code, birthday, country, stripe_connect_account_id'
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

    if (
      (profile as any)?.payout_provider &&
      (profile as any).payout_provider !== 'stripe'
    ) {
      return Response.json(
        { error: 'Compte non-Stripe: bootstrap indisponible.' },
        { status: 400 }
      )
    }

    if (profile.stripe_connect_account_id) {
      return Response.json({
        status: 'exists',
        account_id: profile.stripe_connect_account_id,
      })
    }

    const allowedCountries = getStripeConnectAllowedCountries()
    const normalizedCountry = profile.country?.trim().toUpperCase() || null

    if (!normalizedCountry) {
      return Response.json(
        { error: 'Pays de résidence requis' },
        { status: 400 }
      )
    }

    if (normalizedCountry && !isResidenceCountry(normalizedCountry)) {
      return Response.json(
        { error: 'Pays de résidence non pris en charge' },
        { status: 400 }
      )
    }

    const resolvedCountry = resolveStripeConnectCountry(
      normalizedCountry,
      allowedCountries
    )
    const fallbackCountry = getStripeConnectFallbackCountry(allowedCountries)

    if (!resolvedCountry && !fallbackCountry) {
      return Response.json(
        { error: 'Aucun pays Stripe Connect disponible' },
        { status: 400 }
      )
    }

    const body = await req
      .json()
      .catch(() => ({}) as { accountTokenId?: string })
    const accountTokenId =
      typeof body?.accountTokenId === 'string' ? body.accountTokenId : undefined
    const country = resolvedCountry ?? fallbackCountry
    if (!country) {
      return Response.json(
        { error: 'Aucun pays Stripe Connect disponible' },
        { status: 400 }
      )
    }

    const individual: Record<string, unknown> = {}
    if (profile.firstname?.trim()) {
      individual.first_name = profile.firstname.trim()
    }
    if (profile.lastname?.trim()) {
      individual.last_name = profile.lastname.trim()
    }
    if (profile.email?.trim()) individual.email = profile.email.trim()
    if (profile.phone?.trim()) individual.phone = profile.phone.trim()

    const dob = parseDob(profile.birthday)
    if (dob) {
      individual.dob = dob
    }

    if (profile.address?.trim()) {
      individual.address = {
        line1: profile.address.trim(),
        city: profile.city?.trim() || undefined,
        postal_code: profile.postal_code?.trim() || undefined,
        country,
      }
    }

    const accountTokenData: AccountTokenData = {
      business_type: 'individual',
      individual: Object.keys(individual).length > 0 ? individual : undefined,
    }

    let accountId: string
    try {
      accountId = await createConnectedAccount(
        profile.id,
        profile.email || user.email || undefined,
        country,
        accountTokenData,
        'custom',
        accountTokenId
      )
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'ACCOUNT_TOKEN_REQUIRED'
      ) {
        return Response.json(
          { error: 'Compte de paiement indisponible pour le moment.' },
          { status: 400 }
        )
      }
      throw error
    }

    const status = await checkAccountStatus(accountId)
    const requirements = status.requirements || null
    const requirementsJson = requirements
      ? (JSON.parse(JSON.stringify(requirements)) as Record<string, unknown>)
      : null

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        stripe_connect_account_id: accountId,
        stripe_payouts_enabled: Boolean(status.payoutsEnabled),
        stripe_onboarding_completed: Boolean(status.payoutsEnabled),
        stripe_requirements: requirementsJson,
        payout_provider: 'stripe',
      } as any)
      .eq('id', profile.id)

    if (updateError) {
      return Response.json(
        { error: "Impossible d'enregistrer le compte de paiement" },
        { status: 500 }
      )
    }

    try {
      await getAccountRepresentative(accountId)
    } catch (error) {
      if (isStripeAccountMissing(error)) {
        await supabase
          .from('profiles')
          .update({
            stripe_connect_account_id: null,
            stripe_payouts_enabled: false,
            stripe_onboarding_completed: false,
            stripe_requirements: null,
          } as any)
          .eq('id', profile.id)

        return Response.json(
          { error: 'Compte supprimé. Réessayez.' },
          { status: 400 }
        )
      }
    }

    return Response.json({ status: 'created', account_id: accountId })
  } catch (error) {
    console.error('Connect bootstrap error:', error)
    return Response.json(
      { error: "Impossible d'initialiser le compte de paiement" },
      { status: 500 }
    )
  }
}
