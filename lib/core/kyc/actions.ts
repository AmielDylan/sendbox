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
  type AccountTokenData,
  type ConnectCountry,
} from '@/lib/services/stripe-connect'
import { stripe } from '@/lib/shared/services/stripe/config'

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
      documentType,
      documentCountry,
      birthday,
      address,
      city,
      postalCode,
    } = validation.data

    const country: ConnectCountry =
      documentCountry === 'BJ' || documentCountry === 'FR'
        ? documentCountry
        : 'FR'

    const individual: Record<string, unknown> = {}
    if (profile.firstname?.trim()) {
      individual.first_name = profile.firstname.trim()
    }
    if (profile.lastname?.trim()) {
      individual.last_name = profile.lastname.trim()
    }
    if (profile.email?.trim()) individual.email = profile.email.trim()
    if (profile.phone?.trim()) individual.phone = profile.phone.trim()

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

    let accountId = profile.stripe_connect_account_id || null

    if (!accountId) {
      accountId = await createConnectedAccount(
        user.id,
        profile.email || user.email || undefined,
        country,
        accountTokenData
      )

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ stripe_connect_account_id: accountId })
        .eq('id', user.id)

      if (updateError) {
        return {
          error: "Impossible d'enregistrer le compte de paiement",
        }
      }
    } else {
      try {
        await getAccountRepresentative(accountId)
      } catch (error) {
        if (isStripeAccountMissing(error)) {
          accountId = await createConnectedAccount(
            user.id,
            profile.email || user.email || undefined,
            country,
            accountTokenData
          )

          const { error: replaceError } = await supabase
            .from('profiles')
            .update({ stripe_connect_account_id: accountId })
            .eq('id', user.id)

          if (replaceError) {
            return {
              error: "Impossible d'enregistrer le compte de paiement",
            }
          }
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

    const { personId } = await getAccountRepresentative(accountId)

    if (!personId) {
      return {
        error: "Impossible d'identifier la personne à vérifier",
      }
    }

    const session = await createIdentityVerificationSession({
      email,
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
        address: address?.trim() || profile.address,
        city: city?.trim() || profile.city,
        postal_code: postalCode?.trim() || profile.postal_code,
        birthday: birthday || profile.birthday,
        country: profile.country || documentCountry,
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
