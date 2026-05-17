/**
 * Server Actions pour le KYC
 * V1 : vérification manuelle par admin (sans Stripe Identity)
 */

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/shared/db/server'
import {
  kycReviewSchema,
  type KYCReviewInput,
  type StripeIdentityInput,
} from '@/lib/core/kyc/validations'
import { isResidenceCountry } from '@/lib/shared/kyc/residence-countries'
import { sendEmail } from '@/lib/shared/services/email/client'

/**
 * Soumet les informations KYC (profil + pays) pour vérification manuelle
 */
export async function startKYCVerification(input: StripeIdentityInput) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Vous devez être connecté pour vérifier votre identité' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, kyc_status')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return { error: 'Profil introuvable' }
  }

  if (profile.role === 'admin') {
    return { error: 'Accès réservé aux utilisateurs' }
  }

  if (profile.kyc_status === 'approved') {
    return { error: 'Votre identité est déjà vérifiée' }
  }

  const normalizedCountry = (input.accountCountry || '').toUpperCase().trim()
  if (!isResidenceCountry(normalizedCountry)) {
    return { error: 'Pays de résidence non pris en charge pour le moment.' }
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      kyc_status: 'pending',
      kyc_submitted_at: new Date().toISOString(),
      kyc_document_type: input.documentType,
      kyc_nationality: (input.documentCountry || '').toUpperCase().trim(),
      kyc_rejection_reason: null,
      firstname: input.firstName?.trim() || undefined,
      lastname: input.lastName?.trim() || undefined,
      phone: input.phone?.trim() || undefined,
      address: input.address?.trim() || undefined,
      city: input.city?.trim() || undefined,
      postal_code: input.postalCode?.trim() || undefined,
      birthday: input.birthday || undefined,
      country: normalizedCountry,
    })
    .eq('id', user.id)

  if (updateError) {
    return { error: "Impossible d'enregistrer les informations KYC" }
  }

  revalidatePath('/dashboard/reglages/kyc')
  return {
    success: true,
    message:
      'Vérification soumise. Notre équipe examinera votre dossier sous 24-48h.',
  }
}

/**
 * Récupère le statut KYC de l'utilisateur actuel
 */
export async function getKYCStatus() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non authentifié' }
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('kyc_status, kyc_submitted_at, kyc_document_type')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    return { error: 'Profil introuvable' }
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non authentifié' }
  }

  const validation = kycReviewSchema.safeParse(formData)
  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || 'Données invalides',
    }
  }

  try {
    const { profileId, action, rejectionReason } = validation.data

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
      return { error: 'Erreur lors de la mise à jour du statut KYC' }
    }

    ;(async () => {
      const { data: kycProfile } = await supabase
        .from('profiles')
        .select('email, firstname')
        .eq('id', profileId)
        .single()
      if (!kycProfile?.email) return
      if (action === 'approve') {
        await sendEmail({
          to: kycProfile.email,
          subject: 'Votre identité a été vérifiée',
          template: 'notification',
          data: {
            title: 'Identité vérifiée ✓',
            content: `${kycProfile.firstname ? `Bonjour ${kycProfile.firstname},\n\n` : ''}Votre vérification d'identité a été approuvée. Vous pouvez maintenant publier des trajets sur Sendbox.`,
            ctaText: 'Publier un trajet',
            ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/annonces/new`,
          },
        })
      } else {
        await sendEmail({
          to: kycProfile.email,
          subject: "Vérification d'identité refusée",
          template: 'notification',
          data: {
            title: 'Vérification refusée',
            content: `${kycProfile.firstname ? `Bonjour ${kycProfile.firstname},\n\n` : ''}Votre vérification d'identité a été refusée.${rejectionReason ? `\n\nMotif : ${rejectionReason}` : ''}\n\nVous pouvez relancer la procédure depuis vos réglages.`,
            ctaText: 'Relancer la vérification',
            ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/reglages/kyc`,
          },
        })
      }
    })().catch(console.error)

    revalidatePath('/admin/kyc')
    return {
      success: true,
      message: `KYC ${action === 'approve' ? 'approuvé' : 'rejeté'} avec succès`,
    }
  } catch (error) {
    console.error('Review KYC error:', error)
    return { error: 'Une erreur est survenue. Veuillez réessayer.' }
  }
}

/**
 * Récupère la liste des KYC en attente (admin)
 */
export async function getPendingKYC() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non authentifié' }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, firstname, lastname, kyc_status, kyc_submitted_at, kyc_document_type, kyc_nationality, kyc_rejection_reason'
    )
    .eq('kyc_status', 'pending')
    .order('kyc_submitted_at', { ascending: true })

  if (error) {
    console.error('Get pending KYC error:', error)
    return { error: 'Erreur lors de la récupération des KYC' }
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
