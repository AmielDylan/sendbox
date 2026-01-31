import { createClient } from '@/lib/shared/db/server'
import { checkAccountStatus } from '@/lib/services/stripe-connect'

const WALLET_OPERATORS = ['mtn_open', 'moov', 'sbin'] as const

type WalletOperator = (typeof WALLET_OPERATORS)[number]

type PayoutMethodRequest = {
  method: 'stripe_bank' | 'mobile_wallet'
  walletOperator?: WalletOperator
  phoneNumber?: string
  otpCode?: string
}

const OTP_TTL_MINUTES = 10

const normalizePhone = (input: string) =>
  input.replace(/\s|\(|\)|\.|-/g, '').replace(/^\+/, '')

const stripCountryPrefix = (input: string) =>
  input.startsWith('229') ? input.slice(3) : input

const isValidSbin = (phone: string) => phone.startsWith('01')

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = (await req.json().catch(() => null)) as
      | PayoutMethodRequest
      | null

    if (!body?.method) {
      return Response.json({ error: 'Méthode invalide' }, { status: 400 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(
        'id, role, stripe_connect_account_id, wallet_otp_code, wallet_otp_expires_at'
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

    if (body.method === 'stripe_bank') {
      let payoutStatus: 'pending' | 'active' = 'pending'
      let stripeFlags: { stripe_payouts_enabled?: boolean } = {}

      if (profile.stripe_connect_account_id) {
        const status = await checkAccountStatus(
          profile.stripe_connect_account_id
        )
        if (status.payoutsEnabled) {
          payoutStatus = 'active'
          stripeFlags = { stripe_payouts_enabled: true }
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          payout_method: 'stripe_bank',
          payout_status: payoutStatus,
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
        return Response.json({ error: 'Mise à jour impossible' }, { status: 500 })
      }

      return Response.json({ status: payoutStatus })
    }

    const operator = body.walletOperator
    if (!operator || !WALLET_OPERATORS.includes(operator)) {
      return Response.json({ error: 'Opérateur invalide' }, { status: 400 })
    }

    if (!body.phoneNumber) {
      return Response.json({ error: 'Numéro requis' }, { status: 400 })
    }

    const normalized = stripCountryPrefix(normalizePhone(body.phoneNumber))

    if (operator === 'sbin' && !isValidSbin(normalized)) {
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

      const { error } = await supabase
        .from('profiles')
        .update({
          payout_method: 'mobile_wallet',
          payout_status: 'active',
          wallet_operator: operator,
          wallet_phone: normalized,
          wallet_verified_at: new Date().toISOString(),
          wallet_otp_code: null,
          wallet_otp_expires_at: null,
          stripe_payouts_enabled: false,
          stripe_onboarding_completed: false,
        } as any)
        .eq('id', user.id)

      if (error) {
        return Response.json({ error: 'Validation impossible' }, { status: 500 })
      }

      return Response.json({ status: 'active' })
    }

    const otpCode = `${Math.floor(100000 + Math.random() * 900000)}`
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000)

    const { error } = await supabase
      .from('profiles')
      .update({
        payout_method: 'mobile_wallet',
        payout_status: 'pending',
        wallet_operator: operator,
        wallet_phone: normalized,
        wallet_verified_at: null,
        wallet_otp_code: otpCode,
        wallet_otp_expires_at: expiresAt.toISOString(),
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
