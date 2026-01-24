/**
 * Server Actions pour les annonces
 */

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from "@/lib/shared/db/server"
import {
  createAnnouncementSchema,
  type CreateAnnouncementInput,
} from "@/lib/core/announcements/validations"
import { isFeatureEnabled } from "@/lib/shared/config/features"

const MAX_ACTIVE_ANNOUNCEMENTS = 10

/**
 * Crée une nouvelle annonce
 */
export async function createAnnouncement(formData: CreateAnnouncementInput) {
  const supabase = await createClient()

  // Vérifier l'authentification
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      error: 'Vous devez être connecté pour créer une annonce',
    }
  }

  // Récupérer le profil pour vérifier le KYC
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('kyc_status, kyc_rejection_reason')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return {
      error: 'Profil introuvable',
    }
  }

  const intent = formData.intent === 'draft' ? 'draft' : 'publish'

  // Vérifier que le KYC est approuvé SEULEMENT si feature activée
  if (isFeatureEnabled('KYC_ENABLED') && profile.kyc_status !== 'approved' && intent !== 'draft') {
    let errorMessage = 'Vérification d\'identité requise pour continuer'
    let errorDetails = 'Veuillez compléter votre vérification d\'identité pour publier une annonce.'
    
    if (profile.kyc_status === 'pending') {
      errorMessage = 'Vérification en cours'
      errorDetails = 'Votre vérification d\'identité est en cours d\'examen. Vous pourrez publier vos annonces une fois celle-ci approuvée (24-48h).'
    } else if (profile.kyc_status === 'rejected') {
      errorMessage = 'Vérification refusée'
      errorDetails = profile.kyc_rejection_reason 
        ? `Votre vérification a été refusée : ${profile.kyc_rejection_reason}. Veuillez soumettre de nouveaux documents.`
        : 'Votre vérification a été refusée. Veuillez soumettre de nouveaux documents depuis vos réglages.'
    } else if (profile.kyc_status === 'incomplete') {
      errorMessage = 'Vérification d\'identité incomplète'
      errorDetails = 'Veuillez soumettre vos documents d\'identité pour publier une annonce.'
    }
    
    return {
      error: errorMessage,
      errorDetails,
      field: 'kyc',
    }
  }

  // Vérifier le nombre d'annonces actives
  const { data: activeAnnouncements, error: countError } = await supabase
    .from('announcements')
    .select('id', { count: 'exact', head: false })
    .eq('traveler_id', user.id)
    .in('status', ['draft', 'active'])

  if (countError) {
    console.error('Error counting announcements:', countError)
    return {
      error: 'Erreur lors de la vérification des annonces',
    }
  }

  const activeCount = activeAnnouncements?.length || 0
  if (activeCount >= MAX_ACTIVE_ANNOUNCEMENTS) {
    return {
      error: `Vous avez atteint la limite de ${MAX_ACTIVE_ANNOUNCEMENTS} annonces actives. Veuillez clôturer ou supprimer une annonce existante.`,
      field: 'limit',
    }
  }

  // Validation Zod
  const validation = createAnnouncementSchema.safeParse(formData)
  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || 'Données invalides',
      field: String(validation.error.issues[0]?.path[0] || 'unknown'),
    }
  }

  try {
    // Fonction pour convertir une Date en string ISO de date locale (YYYY-MM-DD)
    const toLocalDateString = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const status = intent === 'draft' ? 'draft' : 'active'

    // Créer l'annonce
    const { data: announcement, error: createError } = await supabase
      .from('announcements')
      .insert({
        traveler_id: user.id,
        departure_country: validation.data.departure_country,
        departure_city: validation.data.departure_city,
        arrival_country: validation.data.arrival_country,
        arrival_city: validation.data.arrival_city,
        departure_date: toLocalDateString(validation.data.departure_date),
        arrival_date: toLocalDateString(validation.data.arrival_date),
        available_kg: validation.data.available_kg,
        price_per_kg: validation.data.price_per_kg,
        description: validation.data.description || null,
        status, // draft ou active selon l'intention
      })
      .select('id')
      .single()

    if (createError) {
      console.error('Create announcement error:', createError)
      return {
        error: "Erreur lors de la création de l'annonce",
      }
    }

    console.log('Announcement created successfully:', announcement)

    revalidatePath('/dashboard/annonces')
    if (status === 'active') {
      revalidatePath('/annonces')
    }

    return {
      success: true,
      announcementId: announcement.id,
      message:
        status === 'draft'
          ? 'Annonce enregistrée en brouillon'
          : 'Annonce publiée avec succès',
    }
  } catch (error) {
    console.error('Create announcement error:', error)
    return {
      error: 'Une erreur est survenue. Veuillez réessayer.',
    }
  }
}

/**
 * Récupère le nombre d'annonces actives de l'utilisateur
 */
export async function getActiveAnnouncementsCount() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      error: 'Non authentifié',
    }
  }

  const { count, error } = await supabase
    .from('announcements')
    .select('*', { count: 'exact', head: true })
    .eq('traveler_id', user.id)
    .in('status', ['draft', 'active'])

  if (error) {
    return {
      error: "Erreur lors de la récupération du nombre d'annonces",
    }
  }

  return {
    count: count || 0,
    maxAllowed: MAX_ACTIVE_ANNOUNCEMENTS,
  }
}


