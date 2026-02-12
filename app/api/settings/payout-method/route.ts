import { createClient } from '@/lib/shared/db/server'
import { checkAccountStatus } from '@/lib/services/stripe-connect'
import { createFlutterwaveBankRecipient } from '@/lib/services/flutterwave'

type PayoutMethodRequest = {
  method: 'stripe_bank' | 'mobile_wallet' | 'bank_transfer'
  walletOperator?: string
  phoneNumber?: string
  otpCode?: string
  bankAccountNumber?: string
  bankCode?: string
  bankAccountName?: string
  bankCurrency?: string
}

const OTP_TTL_MINUTES = 10

const normalizePhone = (input: string) =>
  input.replace(/\s|\(|\)|\.|-/g, '').replace(/^\+/, '')

const stripCountryPrefix = (input: string, country?: string) => {
  if (country === 'BJ' && input.startsWith('229')) {
    return input.slice(3)
  }
  return input
}

const isCeltisOperator = (value: string) => /(celtis|celtiis|sbin)/i.test(value)

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = (await req
      .json()
      .catch(() => null)) as PayoutMethodRequest | null

    if (!body?.method) {
      return Response.json({ error: 'Méthode invalide' }, { status: 400 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(
        'id, role, country, kyc_status, payout_provider, stripe_connect_account_id, wallet_otp_code, wallet_otp_expires_at'
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

    const payoutProvider =
      (profile as any)?.payout_provider ||
      (profile.stripe_connect_account_id ? 'stripe' : null)

    if (body.method === 'stripe_bank') {
      if (payoutProvider && payoutProvider !== 'stripe') {
        return Response.json(
          { error: 'Méthode réservée aux comptes Stripe' },
          { status: 400 }
        )
      }
      let payoutStatus: 'pending' | 'active' = 'pending'
      let stripeFlags: { stripe_payouts_enabled?: boolean } = {}

      if (profile.stripe_connect_account_id) {
        const status = await checkAccountStatus(
          profile.stripe_connect_account_id
        )
        if (status.missing) {
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
        } else if (status.payoutsEnabled) {
          payoutStatus = 'active'
          stripeFlags = { stripe_payouts_enabled: true }
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          payout_method: 'stripe_bank',
          payout_status: payoutStatus,
          payout_provider: 'stripe',
          flutterwave_subaccount_id: null,
          flutterwave_recipient_id: null,
          flutterwave_recipient_type: null,
          flutterwave_recipient_currency: null,
          flutterwave_bank_account_number: null,
          flutterwave_bank_code: null,
          flutterwave_bank_account_name: null,
          fedapay_id: null,
          wallet_operator: null,
          wallet_phone: null,
          wallet_verified_at: null,
          wallet_otp_code: null,
          wallet_otp_expires_at: null,
          stripe_onboarding_completed: payoutStatus === 'active',
          ...stripeFlags,
        } as any)
        .eq('id', user.id)

      if (error) {
        return Response.json(
          { error: 'Mise à jour impossible' },
          { status: 500 }
        )
      }

      return Response.json({ status: payoutStatus })
    }

    if (body.method === 'bank_transfer') {
      if (payoutProvider === 'fedapay') {
        return Response.json(
          { error: 'Virement bancaire indisponible pour ce pays.' },
          { status: 400 }
        )
      }
      if (payoutProvider && payoutProvider !== 'flutterwave') {
        return Response.json(
          { error: 'Méthode réservée aux comptes Flutterwave' },
          { status: 400 }
        )
      }

      if ((profile as any)?.kyc_status !== 'approved') {
        return Response.json(
          { error: "Votre identité doit être vérifiée avant l'activation." },
          { status: 403 }
        )
      }

      if (
        !body.bankAccountNumber?.trim() ||
        !body.bankCode?.trim() ||
        !body.bankAccountName?.trim()
      ) {
        return Response.json(
          { error: 'Informations bancaires requises' },
          { status: 400 }
        )
      }

      const destinationCurrency =
        body.bankCurrency?.trim().toUpperCase() || 'XOF'
      const recipientType = `bank_${destinationCurrency.toLowerCase()}`

      const recipient = await createFlutterwaveBankRecipient({
        type: recipientType,
        accountNumber: body.bankAccountNumber.trim(),
        bankCode: body.bankCode.trim(),
      })

      const { error } = await supabase
        .from('profiles')
        .update({
          payout_method: 'bank_transfer',
          payout_status: 'active',
          payout_provider: 'flutterwave',
          flutterwave_recipient_id: recipient?.data?.id || null,
          flutterwave_recipient_type: recipientType,
          flutterwave_recipient_currency: destinationCurrency,
          flutterwave_bank_account_number: body.bankAccountNumber.trim(),
          flutterwave_bank_code: body.bankCode.trim(),
          flutterwave_bank_account_name: body.bankAccountName.trim(),
          wallet_operator: null,
          wallet_phone: null,
          wallet_verified_at: null,
          wallet_otp_code: null,
          wallet_otp_expires_at: null,
          stripe_payouts_enabled: false,
          stripe_onboarding_completed: false,
        } as any)
        .eq('id', user.id)

      if (error) {
        return Response.json(
          { error: 'Mise à jour impossible' },
          { status: 500 }
        )
      }

      return Response.json({ status: 'active' })
    }

    if (
      payoutProvider &&
      !['flutterwave', 'fedapay'].includes(payoutProvider)
    ) {
      return Response.json(
        { error: 'Méthode réservée aux comptes Flutterwave/FedaPay' },
        { status: 400 }
      )
    }

    if ((profile as any)?.kyc_status !== 'approved') {
      return Response.json(
        { error: "Votre identité doit être vérifiée avant l'activation." },
        { status: 403 }
      )
    }

    const operatorRaw =
      typeof body.walletOperator === 'string' ? body.walletOperator.trim() : ''
    if (!operatorRaw) {
      return Response.json({ error: 'Opérateur invalide' }, { status: 400 })
    }
    const operator = operatorRaw.toLowerCase()

    if (!body.phoneNumber) {
      return Response.json({ error: 'Numéro requis' }, { status: 400 })
    }

    const normalized = stripCountryPrefix(
      normalizePhone(body.phoneNumber),
      profile.country || undefined
    )

    if (
      profile.country === 'BJ' &&
      isCeltisOperator(operator) &&
      !normalized.startsWith('01')
    ) {
      return Response.json(
        { error: 'Le numéro Celtis doit commencer par 01.' },
        { status: 400 }
      )
    }

    if (body.otpCode) {
      const expiresAt = profile.wallet_otp_expires_at
        ? new Date(profile.wallet_otp_expires_at)
        : null

      if (!profile.wallet_otp_code || !expiresAt || expiresAt < new Date()) {
        return Response.json({ error: 'OTP expiré' }, { status: 400 })
      }

      if (body.otpCode !== profile.wallet_otp_code) {
        return Response.json({ error: 'OTP invalide' }, { status: 400 })
      }

      const provider = payoutProvider === 'fedapay' ? 'fedapay' : 'flutterwave'

      const { error } = await supabase
        .from('profiles')
        .update({
          payout_method: 'mobile_wallet',
          payout_status: 'active',
          payout_provider: provider,
          wallet_operator: operator,
          wallet_phone: normalized,
          wallet_verified_at: new Date().toISOString(),
          wallet_otp_code: null,
          wallet_otp_expires_at: null,
          flutterwave_bank_account_number: null,
          flutterwave_bank_code: null,
          flutterwave_bank_account_name: null,
          stripe_payouts_enabled: false,
          stripe_onboarding_completed: false,
        } as any)
        .eq('id', user.id)

      if (error) {
        return Response.json(
          { error: 'Validation impossible' },
          { status: 500 }
        )
      }

      return Response.json({ status: 'active' })
    }

    const otpCode = `${Math.floor(100000 + Math.random() * 900000)}`
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000)

    const provider = payoutProvider === 'fedapay' ? 'fedapay' : 'flutterwave'

    const { error } = await supabase
      .from('profiles')
      .update({
        payout_method: 'mobile_wallet',
        payout_status: 'pending',
        payout_provider: provider,
        wallet_operator: operator,
        wallet_phone: normalized,
        wallet_verified_at: null,
        wallet_otp_code: otpCode,
        wallet_otp_expires_at: expiresAt.toISOString(),
        flutterwave_bank_account_number: null,
        flutterwave_bank_code: null,
        flutterwave_bank_account_name: null,
        stripe_payouts_enabled: false,
        stripe_onboarding_completed: false,
      } as any)
      .eq('id', user.id)

    if (error) {
      return Response.json({ error: 'Mise à jour impossible' }, { status: 500 })
    }

    return Response.json({
      status: 'pending',
      otp_sent: true,
      dev_otp: process.env.NODE_ENV === 'production' ? undefined : otpCode,
    })
  } catch (error) {
    console.error('Payout method error:', error)
    return Response.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
