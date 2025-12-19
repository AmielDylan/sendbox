/**
 * Server Actions pour la gestion des annonces (édition, suppression, etc.)
 */

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

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
      error: 'Vous n\'êtes pas autorisé à supprimer cette annonce',
    }
  }

  // Vérifier qu'il n'y a pas de bookings actifs
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('id')
    .eq('announcement_id', announcementId)
    .in('status', ['pending', 'confirmed', 'in_transit'])

  if (bookingsError) {
    return {
      error: 'Erreur lors de la vérification des réservations',
    }
  }

  if (bookings && bookings.length > 0) {
    return {
      error:
        'Impossible de supprimer cette annonce car elle a des réservations actives',
    }
  }

  // Supprimer l'annonce
  const { error: deleteError } = await supabase
    .from('announcements')
    .delete()
    .eq('id', announcementId)

  if (deleteError) {
    return {
      error: 'Erreur lors de la suppression de l\'annonce',
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
      error: 'Vous n\'êtes pas autorisé à modifier cette annonce',
    }
  }

  // Mettre à jour le statut
  const { error: updateError } = await supabase
    .from('announcements')
    .update({ status: 'completed' })
    .eq('id', announcementId)

  if (updateError) {
    return {
      error: 'Erreur lors de la mise à jour de l\'annonce',
    }
  }

  revalidatePath('/dashboard/annonces')
  return {
    success: true,
    message: 'Annonce marquée comme terminée',
  }
}





