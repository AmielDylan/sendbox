/**
 * Server Actions pour le KYC
 */

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from "@/lib/shared/db/server"
import {
  kycSchema,
  kycReviewSchema,
  type KYCInput,
  type KYCReviewInput,
  stripeIdentitySchema,
  type StripeIdentityInput,
} from "@/lib/core/kyc/validations"
import {
  processImage,
  generateSecureFileName,
} from "@/lib/shared/utils/files"
import { validateKYCDocument } from "@/lib/shared/security/upload-validation"
import { uploadRateLimit } from "@/lib/shared/security/rate-limit"
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
    console.error('Identity session error:', error)
    return {
      error: "La vérification d'identité n'a pas pu démarrer. Réessayez plus tard.",
    }
  }
}

/**
 * Upload et soumission du formulaire KYC
 */
export async function submitKYC(formData: FormData) {
  const supabase = await createClient()

  // Vérifier l'authentification
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      error: 'Vous devez être connecté pour soumettre votre KYC',
    }
  }

  // Récupérer le profil
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return {
      error: 'Profil introuvable',
    }
  }

  // Vérifier que le KYC n'est pas déjà approuvé
  if (profile.kyc_status === 'approved') {
    return {
      error: 'Votre KYC est déjà approuvé',
    }
  }

  try {
    // Rate limiting pour uploads
    const rateLimitResult = await uploadRateLimit(user.id)
    if (!rateLimitResult.success) {
      return {
        error: `Trop d'uploads. Réessayez après ${rateLimitResult.reset.toLocaleTimeString('fr-FR')}`,
      }
    }

    // Extraire les données du FormData
    const documentType = formData.get('documentType') as string
    const documentNumber = formData.get('documentNumber') as string
    const documentFront = formData.get('documentFront') as File
    const documentBack = formData.get('documentBack') as File | null
    const birthday = formData.get('birthday') as string
    const nationality = formData.get('nationality') as string
    const address = formData.get('address') as string

    // Valider les fichiers
    if (!documentFront || !(documentFront instanceof File)) {
      return {
        error: 'Document recto requis',
      }
    }

    // Valider avec magic bytes (nouvelle validation renforcée)
    const frontValidation = await validateKYCDocument(documentFront)
    if (!frontValidation.valid) {
      return {
        error: `Document recto : ${frontValidation.error}`,
        field: 'documentFront',
      }
    }

    if (documentBack && documentBack instanceof File && documentBack.size > 0) {
      const backValidation = await validateKYCDocument(documentBack)
      if (!backValidation.valid) {
        return {
          error: `Document verso : ${backValidation.error || 'Format invalide'}`,
          field: 'documentBack',
        }
      }
    }

    // Préparer les données pour validation Zod
    const kycData: Partial<KYCInput> = {
      documentType: documentType as 'passport' | 'national_id',
      documentNumber,
      documentFront,
      documentBack:
        documentBack && documentBack.size > 0 ? documentBack : undefined,
      birthday: new Date(birthday),
      nationality,
      address,
    }

    // Validation Zod
    const validation = kycSchema.safeParse(kycData)
    if (!validation.success) {
      return {
        error: validation.error.issues[0]?.message || 'Données invalides',
        field: String(validation.error.issues[0]?.path[0] || 'unknown'),
      }
    }

    // Traiter et uploader les fichiers
    const bucket = 'kyc-documents'
    const userId = user.id

    // Traiter le document recto
    const frontProcessed = await processImage(validation.data.documentFront)
    const frontFileName = generateSecureFileName(
      userId,
      validation.data.documentType,
      'front',
      validation.data.documentFront.name
    )

    const { error: uploadFrontError } = await supabase.storage
      .from(bucket)
      .upload(frontFileName, frontProcessed, {
        contentType:
          validation.data.documentFront.type === 'application/pdf'
            ? 'application/pdf'
            : 'image/jpeg',
        upsert: false,
      })

    if (uploadFrontError) {
      console.error('Upload front error:', uploadFrontError)
      return {
        error: "Erreur lors de l'upload du document recto",
      }
    }

    // Traiter le document verso si fourni
    let backFileName: string | null = null
    if (validation.data.documentBack && validation.data.documentBack.size > 0) {
      const backProcessed = await processImage(validation.data.documentBack)
      backFileName = generateSecureFileName(
        userId,
        validation.data.documentType,
        'back',
        validation.data.documentBack.name
      )

      const { error: uploadBackError } = await supabase.storage
        .from(bucket)
        .upload(backFileName, backProcessed, {
          contentType:
            validation.data.documentBack.type === 'application/pdf'
              ? 'application/pdf'
              : 'image/jpeg',
          upsert: false,
        })

      if (uploadBackError) {
        console.error('Upload back error:', uploadBackError)
        // Nettoyer le fichier front si le back échoue
        await supabase.storage.from(bucket).remove([frontFileName])
        return {
          error: "Erreur lors de l'upload du document verso",
        }
      }
    }

    // Mettre à jour le profil avec les informations KYC
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        kyc_status: 'pending',
        kyc_document_type: validation.data.documentType,
        kyc_document_number: validation.data.documentNumber,
        kyc_document_front: frontFileName,
        kyc_document_back: backFileName,
        kyc_birthday: validation.data.birthday.toISOString(),
        kyc_nationality: validation.data.nationality,
        kyc_address: validation.data.address,
        kyc_submitted_at: new Date().toISOString(),
      })
      .eq('id', profile.id)

    if (updateError) {
      console.error('Update profile error:', updateError)
      // Nettoyer les fichiers uploadés
      const filesToRemove = [frontFileName]
      if (backFileName) filesToRemove.push(backFileName)
      await supabase.storage.from(bucket).remove(filesToRemove)
      return {
        error: 'Erreur lors de la mise à jour du profil',
      }
    }

    // TODO: Envoyer email de notification "KYC soumis"

    revalidatePath('/dashboard/reglages/kyc')
    return {
      success: true,
      message:
        'Votre demande KYC a été soumise avec succès. Elle sera examinée sous 24-48h.',
    }
  } catch (error) {
    console.error('Submit KYC error:', error)
    return {
      error: 'Une erreur est survenue. Veuillez réessayer.',
    }
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
 * Génère une URL signée pour visualiser un document KYC (admin uniquement)
 */
export async function getKYCDocumentUrl(filePath: string) {
  const supabase = await createClient()

  // Vérifier que l'utilisateur est admin
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      error: 'Non authentifié',
    }
  }

  // TODO: Vérifier le rôle admin dans la table profiles
  // Pour l'instant, on permet l'accès (à sécuriser)

  const { data, error } = await supabase.storage
    .from('kyc-documents')
    .createSignedUrl(filePath, 3600) // URL valide 1h

  if (error) {
    return {
      error: "Erreur lors de la génération de l'URL",
    }
  }

  return {
    url: data.signedUrl,
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
      'id, firstname, lastname, kyc_status, kyc_submitted_at, kyc_document_type, kyc_document_front, kyc_document_back, kyc_rejection_reason'
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
      kyc_document_front: string | null
      kyc_document_back: string | null
      kyc_rejection_reason: string | null
    }>,
  }
}
