/**
 * Server Actions pour le KYC
 */

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/shared/db/server'
import {
  kycReviewSchema,
  type KYCReviewInput,
  stripeIdentitySchema,
  type StripeIdentityInput,
} from '@/lib/core/kyc/validations'
import { createIdentityVerificationSession } from '@/lib/shared/services/stripe/identity'
import {
  createConnectedAccount,
  getAccountRepresentative,
  isStripeAccountMissing,
  isStripeCountryUnsupported,
  type AccountTokenData,
} from '@/lib/services/stripe-connect'
import { stripe } from '@/lib/shared/services/stripe/config'
import {
  getStripeConnectAllowedCountries,
  resolveStripeConnectCountry,
} from '@/lib/shared/stripe/connect-allowed'
import type Stripe from 'stripe'

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

/**
 * Prépare le compte Stripe Connect pour le pays du document KYC
 * (création ou recréation si le pays change)
 */
export async function prepareKYCAccount(documentCountry: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      error: 'Vous devez être connecté pour vérifier votre identité',
    }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, email, stripe_connect_account_id, country')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return {
      error: 'Profil introuvable',
    }
  }

  if (profile.role === 'admin') {
    return {
      error: 'Accès réservé aux utilisateurs',
    }
  }

  const allowedCountries = getStripeConnectAllowedCountries()
  const targetCountry = resolveStripeConnectCountry(
    documentCountry,
    allowedCountries
  )

  if (!targetCountry) {
    return {
      error:
        "Stripe Connect n'est pas disponible pour ce pays pour le moment.",
    }
  }

  const contactEmail = profile.email || user.email || undefined
  const accountTokenData: AccountTokenData = {
    business_type: 'individual',
    tos_shown_and_accepted: true,
  }

  const createAccount = async () => {
    try {
      const accountId = await createConnectedAccount(
        profile.id,
        contactEmail,
        targetCountry,
        accountTokenData
      )
      return { accountId }
    } catch (error) {
      if (isStripeCountryUnsupported(error)) {
        return {
          accountId: null,
          error:
            "Stripe Connect n'est pas disponible pour ce pays pour le moment.",
        }
      }
      throw error
    }
  }

  let accountId = profile.stripe_connect_account_id || null
  let previousAccountId: string | null = null
  let status: 'ready' | 'created' | 'recreated' = 'ready'

  if (!accountId) {
    const created = await createAccount()
    if (created.error) {
      return { error: created.error }
    }
    accountId = created.accountId
    status = 'created'
  } else {
    try {
      const { account } = await getAccountRepresentative(accountId)
      if (account?.country && account.country !== targetCountry) {
        previousAccountId = accountId
        const created = await createAccount()
        if (created.error) {
          return { error: created.error }
        }
        accountId = created.accountId
        status = 'recreated'
      }
    } catch (error) {
      if (isStripeAccountMissing(error)) {
        const created = await createAccount()
        if (created.error) {
          return { error: created.error }
        }
        accountId = created.accountId
        status = 'created'
      } else {
        throw error
      }
    }
  }

  if (!accountId) {
    return {
      error: "Impossible d'initialiser le compte de paiement",
    }
  }

  const updatePayload: Record<string, unknown> = {
    stripe_connect_account_id: accountId,
    stripe_payouts_enabled: false,
    stripe_onboarding_completed: false,
    stripe_requirements: null,
    payout_status: 'disabled',
    country: targetCountry,
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update(updatePayload as any)
    .eq('id', user.id)

  if (updateError) {
    return {
      error: "Impossible d'enregistrer le compte de paiement",
    }
  }

  if (previousAccountId) {
    try {
      await stripe.accounts.del(previousAccountId)
    } catch (error) {
      console.warn('Failed to delete previous Stripe account:', error)
    }
  }

  return {
    success: true,
    status,
    accountId,
  }
}

/**
 * Démarre une vérification Stripe Identity
 */
export async function startKYCVerification(input: StripeIdentityInput) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      error: 'Vous devez être connecté pour vérifier votre identité',
    }
  }

  const validation = stripeIdentitySchema.safeParse(input)
  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || 'Données invalides',
      field: String(validation.error.issues[0]?.path[0] || 'unknown'),
    }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(
      'id, email, kyc_status, role, stripe_connect_account_id, firstname, lastname, phone, address, city, postal_code, birthday, country'
    )
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return {
      error: 'Profil introuvable',
    }
  }

  if (profile.kyc_status === 'approved') {
    return {
      error: 'Votre identité est déjà vérifiée',
    }
  }

  if (profile.role === 'admin') {
    return {
      error: 'Accès réservé aux utilisateurs',
    }
  }

  const email = profile.email || user.email || null

  try {
    const {
      firstName,
      lastName,
      email: inputEmail,
      phone: inputPhone,
      documentType,
      documentCountry,
      birthday,
      address,
      city,
      postalCode,
    } = validation.data

    const allowedCountries = getStripeConnectAllowedCountries()
    const country = resolveStripeConnectCountry(
      documentCountry,
      allowedCountries
    )

    if (!country) {
      return {
        error:
          "Stripe Connect n'est pas disponible pour ce pays pour le moment.",
      }
    }

    const individual: Record<string, unknown> = {}
    if (firstName?.trim()) {
      individual.first_name = firstName.trim()
    } else if (profile.firstname?.trim()) {
      individual.first_name = profile.firstname.trim()
    }
    if (lastName?.trim()) {
      individual.last_name = lastName.trim()
    } else if (profile.lastname?.trim()) {
      individual.last_name = profile.lastname.trim()
    }
    if (inputEmail?.trim()) {
      individual.email = inputEmail.trim()
    } else if (profile.email?.trim()) {
      individual.email = profile.email.trim()
    }
    if (inputPhone?.trim()) {
      individual.phone = inputPhone.trim()
    } else if (profile.phone?.trim()) {
      individual.phone = profile.phone.trim()
    }

    const dob = parseDob(birthday || profile.birthday)
    if (dob) {
      individual.dob = dob
    }

    if (address?.trim()) {
      individual.address = {
        line1: address.trim(),
        city: city?.trim() || undefined,
        postal_code: postalCode?.trim() || undefined,
        country,
      }
    }

    const accountTokenData: AccountTokenData = {
      business_type: 'individual',
      individual: Object.keys(individual).length > 0 ? individual : undefined,
      tos_shown_and_accepted: true,
    }

    const accountId = profile.stripe_connect_account_id || null
    const contactEmail =
      inputEmail?.trim() || profile.email || user.email || null

    if (!accountId) {
      return {
        error:
          "Compte de paiement manquant. Relancez la préparation avant la vérification.",
      }
    }

    let account: Stripe.Account | null = null
    let personId: string | null = null
    try {
      const accountData = await getAccountRepresentative(accountId)
      account = accountData.account
      personId = accountData.personId
    } catch (error) {
      if (isStripeAccountMissing(error)) {
        return {
          error:
            'Compte de paiement supprimé. Relancez la préparation avant la vérification.',
        }
      }
      throw error
    }

    if (account?.country && account.country !== country) {
      return {
        error:
          'Le compte de paiement doit être préparé pour le pays sélectionné.',
      }
    }

    if (Object.keys(individual).length > 0) {
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
    }

    const fallbackProfileUrl = `https://www.gosendbox.com/profil/${user.id}`
    try {
      await stripe.accounts.update(accountId, {
        business_profile: { url: fallbackProfileUrl },
      })
    } catch (error) {
      console.warn('Business profile update failed:', error)
    }

    if (!personId) {
      const accountData = await getAccountRepresentative(accountId)
      personId = accountData.personId
    }

    if (!personId) {
      return {
        error: "Impossible d'identifier la personne à vérifier",
      }
    }

    const session = await createIdentityVerificationSession({
      email: contactEmail,
      userId: user.id,
      documentType,
      documentCountry,
      relatedPerson: {
        accountId,
        personId,
      },
    })

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        kyc_document_type: documentType,
        kyc_nationality: documentCountry,
        kyc_rejection_reason: null,
        firstname: firstName?.trim() || profile.firstname,
        lastname: lastName?.trim() || profile.lastname,
        phone: inputPhone?.trim() || profile.phone,
        address: address?.trim() || profile.address,
        city: city?.trim() || profile.city,
        postal_code: postalCode?.trim() || profile.postal_code,
        birthday: birthday || profile.birthday,
        country: documentCountry || profile.country,
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating profile KYC metadata:', updateError)
    }

    return {
      success: true,
      verificationClientSecret: session.clientSecret,
      message: 'Vérification Stripe Identity prête.',
    }
  } catch (error) {
    console.error('❌ Identity session creation failed:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      userId: user.id,
      email,
      documentType: validation.data.documentType,
      documentCountry: validation.data.documentCountry,
      stripeKeyConfigured: !!process.env.STRIPE_SECRET_KEY,
      stripeKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 7),
    })
    return {
      error:
        "La vérification d'identité n'a pas pu démarrer. Réessayez plus tard.",
    }
  }
}

/**
 * Upload et soumission du formulaire KYC
 */
/**
 * Récupère le statut KYC de l'utilisateur actuel
 */
export async function getKYCStatus() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      error: 'Non authentifié',
    }
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('kyc_status, kyc_submitted_at, kyc_document_type')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    return {
      error: 'Profil introuvable',
    }
  }

  return {
    status: profile.kyc_status,
    submittedAt: profile.kyc_submitted_at,
    documentType: profile.kyc_document_type,
  }
}

/**
 * Review KYC par un admin (approve/reject)
 */
export async function reviewKYC(formData: KYCReviewInput) {
  const supabase = await createClient()

  // Vérifier l'authentification et le rôle admin
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      error: 'Non authentifié',
    }
  }

  // TODO: Vérifier le rôle admin
  // const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
  // if (profile?.role !== 'admin') { return { error: 'Accès refusé' } }

  // Validation
  const validation = kycReviewSchema.safeParse(formData)
  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || 'Données invalides',
    }
  }

  try {
    const { profileId, action, rejectionReason } = validation.data

    // Mettre à jour le statut KYC
    const updateData: Record<string, unknown> = {
      kyc_status: action === 'approve' ? 'approved' : 'rejected',
      kyc_reviewed_at: new Date().toISOString(),
    }

    if (action === 'reject' && rejectionReason) {
      updateData.kyc_rejection_reason = rejectionReason
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', profileId)

    if (updateError) {
      return {
        error: 'Erreur lors de la mise à jour du statut KYC',
      }
    }

    // TODO: Envoyer email de notification
    // - Si approuvé: "KYC approuvé, vous pouvez créer des annonces"
    // - Si rejeté: "KYC rejeté : [raison]"

    revalidatePath('/admin/kyc')
    return {
      success: true,
      message: `KYC ${action === 'approve' ? 'approuvé' : 'rejeté'} avec succès`,
    }
  } catch (error) {
    console.error('Review KYC error:', error)
    return {
      error: 'Une erreur est survenue. Veuillez réessayer.',
    }
  }
}

/**
 * Récupère la liste des KYC en attente (admin)
 */
export async function getPendingKYC() {
  const supabase = await createClient()

  // Vérifier l'authentification et le rôle admin
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      error: 'Non authentifié',
    }
  }

  // TODO: Vérifier le rôle admin

  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, firstname, lastname, kyc_status, kyc_submitted_at, kyc_document_type, kyc_nationality, kyc_rejection_reason'
    )
    .eq('kyc_status', 'pending')
    .order('kyc_submitted_at', { ascending: true })

  if (error) {
    console.error('Get pending KYC error:', error)
    return {
      error: 'Erreur lors de la récupération des KYC',
    }
  }

  return {
    kycList: (data || []) as Array<{
      id: string
      firstname: string | null
      lastname: string | null
      kyc_status: string
      kyc_submitted_at: string | null
      kyc_document_type: string | null
      kyc_nationality: string | null
      kyc_rejection_reason: string | null
    }>,
  }
}
