/**
 * Server Actions pour le KYC
 */

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from "@/lib/shared/db/server"
import {
  kycReviewSchema,
  type KYCReviewInput,
  stripeIdentitySchema,
  type StripeIdentityInput,
} from "@/lib/core/kyc/validations"
import { createIdentityVerificationSession } from "@/lib/shared/services/stripe/identity"

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
    .select('id, email, kyc_status')
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

  const email = profile.email || user.email
  if (!email) {
    return {
      error: 'Email indisponible pour la vérification',
    }
  }

  try {
    const session = await createIdentityVerificationSession({
      email,
      userId: user.id,
      documentType: validation.data.documentType,
      documentCountry: validation.data.documentCountry,
    })

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        kyc_document_type: validation.data.documentType,
        kyc_nationality: validation.data.documentCountry,
        kyc_rejection_reason: null,
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
      error: "La vérification d'identité n'a pas pu démarrer. Réessayez plus tard.",
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
