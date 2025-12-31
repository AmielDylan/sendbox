/**
 * Server Actions pour la gestion des annonces (édition, suppression, etc.)
 */

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from "@/lib/shared/db/server"
import {
  createAnnouncementSchema,
  updateAnnouncementSchema,
  type CreateAnnouncementInput,
} from "@/lib/core/announcements/validations"

/**
 * Met à jour une annonce existante
 */
export async function updateAnnouncement(
  announcementId: string,
  formData: CreateAnnouncementInput
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      error: 'Vous devez être connecté',
    }
  }

  // Vérifier que l'annonce appartient à l'utilisateur
  const { data: announcement, error: fetchError } = await supabase
    .from('announcements')
    .select('id, traveler_id, status')
    .eq('id', announcementId)
    .single()

  if (fetchError || !announcement) {
    return {
      error: 'Annonce introuvable',
    }
  }

  if (announcement.traveler_id !== user.id) {
    return {
      error: "Vous n'êtes pas autorisé à modifier cette annonce",
    }
  }

  // Vérifier qu'il n'y a pas de bookings actifs
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('id')
    .eq('announcement_id', announcementId)
    .in('status', ['accepted', 'in_transit'])

  if (bookingsError) {
    return {
      error: 'Erreur lors de la vérification des réservations',
    }
  }

  if (bookings && bookings.length > 0) {
    return {
      error:
        'Impossible de modifier cette annonce car elle a des réservations confirmées ou en cours',
    }
  }

  // Validation Zod (sans contrainte de date future pour les mises à jour)
  const validation = updateAnnouncementSchema.safeParse(formData)
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

    // Mettre à jour l'annonce
    const { error: updateError } = await supabase
      .from('announcements')
      .update({
        departure_country: validation.data.departure_country,
        departure_city: validation.data.departure_city,
        arrival_country: validation.data.arrival_country,
        arrival_city: validation.data.arrival_city,
        departure_date: toLocalDateString(validation.data.departure_date),
        arrival_date: toLocalDateString(validation.data.arrival_date),
        available_kg: validation.data.available_kg,
        price_per_kg: validation.data.price_per_kg,
        description: validation.data.description || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', announcementId)

    if (updateError) {
      console.error('Update announcement error:', updateError)
      return {
        error: `Erreur lors de la mise à jour de l'annonce: ${updateError.message}`,
      }
    }

    revalidatePath('/dashboard/annonces')
    revalidatePath(`/dashboard/annonces/${announcementId}`)
    revalidatePath('/recherche')

    return {
      success: true,
      message: 'Annonce mise à jour avec succès',
    }
  } catch (error) {
    console.error('Update announcement error:', error)
    return {
      error: 'Une erreur est survenue. Veuillez réessayer.',
    }
  }
}

/**
 * Supprime une annonce
 */
export async function deleteAnnouncement(announcementId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      error: 'Vous devez être connecté',
    }
  }

  // Vérifier que l'annonce appartient à l'utilisateur et récupérer les informations complètes
  const { data: announcement, error: fetchError } = await supabase
    .from('announcements')
    .select('*')
    .eq('id', announcementId)
    .single()

  if (fetchError || !announcement) {
    return {
      error: 'Annonce introuvable',
    }
  }

  if (announcement.traveler_id !== user.id) {
    return {
      error: "Vous n'êtes pas autorisé à supprimer cette annonce",
    }
  }

  // Debug: logger les valeurs des champs
  console.log('deleteAnnouncement - announcement data:', {
    id: announcement.id,
    // Colonnes principales (utilisées dans la création)
    departure_country: announcement.departure_country,
    departure_city: announcement.departure_city,
    arrival_country: announcement.arrival_country,
    arrival_city: announcement.arrival_city,
    available_kg: announcement.available_kg,
    departure_date: announcement.departure_date,
    arrival_date: announcement.arrival_date,
    status: announcement.status,
  })

  // Vérifier que l'annonce a au moins les informations de base (trajet et date)
  const hasBasicInfo = announcement.departure_country && announcement.departure_city &&
                       announcement.arrival_country && announcement.arrival_city &&
                       announcement.departure_date

  if (!hasBasicInfo) {
    console.warn('deleteAnnouncement - annonce incomplète détectée:', announcement.id)
    // Pour les annonces très anciennes ou corrompues, permettre la suppression si pas de réservations
    // Mais d'abord vérifier les réservations
  }

  // Vérifier qu'il n'y a pas de bookings actifs
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('id, status')
    .eq('announcement_id', announcementId)
    .in('status', ['pending', 'accepted', 'in_transit'])

  if (bookingsError) {
    console.error('Erreur lors de la vérification des réservations:', bookingsError)
    return {
      error: `Erreur lors de la vérification des réservations: ${bookingsError.message}. Veuillez réessayer.`,
    }
  }

  if (bookings && bookings.length > 0) {
    const bookingStatuses = bookings.map(b => b.status).join(', ')
    return {
      error: `Impossible de supprimer cette annonce car elle a ${bookings.length} réservation(s) active(s) (statut: ${bookingStatuses})`,
    }
  }

  // Si l'annonce semble incomplète mais n'a pas de réservations, permettre la suppression avec un avertissement
  if (!hasBasicInfo) {
    console.warn('Suppression d\'une annonce potentiellement incomplète:', announcement.id)
    // On permet quand même la suppression car l'annonce n'a pas de réservations actives
  }

  // Supprimer l'annonce
  const { error: deleteError } = await supabase
    .from('announcements')
    .delete()
    .eq('id', announcementId)

  if (deleteError) {
    return {
      error: "Erreur lors de la suppression de l'annonce",
    }
  }

  revalidatePath('/dashboard/annonces')
  return {
    success: true,
    message: 'Annonce supprimée avec succès',
  }
}

/**
 * Marque une annonce comme terminée
 */
export async function markAnnouncementAsCompleted(announcementId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      error: 'Vous devez être connecté',
    }
  }

  // Vérifier que l'annonce appartient à l'utilisateur
  const { data: announcement, error: fetchError } = await supabase
    .from('announcements')
    .select('id, traveler_id')
    .eq('id', announcementId)
    .single()

  if (fetchError || !announcement) {
    return {
      error: 'Annonce introuvable',
    }
  }

  if (announcement.traveler_id !== user.id) {
    return {
      error: "Vous n'êtes pas autorisé à modifier cette annonce",
    }
  }

  // Mettre à jour le statut
  const { error: updateError } = await supabase
    .from('announcements')
    .update({ status: 'completed' })
    .eq('id', announcementId)

  if (updateError) {
    return {
      error: "Erreur lors de la mise à jour de l'annonce",
    }
  }

  revalidatePath('/dashboard/annonces')
  return {
    success: true,
    message: 'Annonce marquée comme terminée',
  }
}

/**
 * Change le statut d'une annonce (draft <-> active)
 */
export async function toggleAnnouncementStatus(announcementId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      error: 'Vous devez être connecté',
    }
  }

  // Récupérer l'annonce
  const { data: announcement, error: fetchError } = await supabase
    .from('announcements')
    .select('id, traveler_id, status')
    .eq('id', announcementId)
    .single()

  if (fetchError || !announcement) {
    return {
      error: 'Annonce introuvable',
    }
  }

  if (announcement.traveler_id !== user.id) {
    return {
      error: "Vous n'êtes pas autorisé à modifier cette annonce",
    }
  }

  // Déterminer le nouveau statut
  const newStatus =
    announcement.status === 'draft' ? 'active' : 'draft'

  // Mettre à jour le statut
  const { error: updateError } = await supabase
    .from('announcements')
    .update({ status: newStatus })
    .eq('id', announcementId)

  if (updateError) {
    return {
      error: "Erreur lors de la mise à jour de l'annonce",
    }
  }

  revalidatePath('/dashboard/annonces')
  revalidatePath('/recherche')
  return {
    success: true,
    message: `Annonce ${newStatus === 'active' ? 'publiée' : 'mise en brouillon'}`,
  }
}
