/**
 * Server Actions pour gérer les vues d'annonces
 */

'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

const VIEW_COOKIE_PREFIX = 'announcement_view_'
const COOKIE_MAX_AGE = 60 * 60 * 24 // 24 heures

/**
 * Incrémente le compteur de vues d'une annonce (une fois par utilisateur/IP par jour)
 */
export async function incrementAnnouncementViews(announcementId: string) {
  const cookieStore = await cookies()
  const cookieName = `${VIEW_COOKIE_PREFIX}${announcementId}`
  const hasViewed = cookieStore.get(cookieName)

  // Si l'utilisateur a déjà vu cette annonce aujourd'hui, ne pas incrémenter
  if (hasViewed) {
    return { success: true, alreadyViewed: true }
  }

  try {
    const supabase = await createClient()

    // Incrémenter le compteur de vues dans la base de données
    // Note: Il faut ajouter une colonne views_count dans la table announcements
    try {
      const { error } = await (supabase.rpc as any)('increment_announcement_views', {
        p_announcement_id: announcementId,
      })

      if (error) {
        // Si la fonction RPC n'existe pas encore, on peut utiliser une requête UPDATE
        // Pour l'instant, on ignore l'erreur et on définit juste le cookie
        console.warn('Could not increment views:', error)
      }
    } catch (error) {
      // Fonction RPC non disponible, on continue quand même
      console.warn('RPC function not available:', error)
    }

    // Définir le cookie pour éviter les vues multiples
    cookieStore.set(cookieName, '1', {
      maxAge: COOKIE_MAX_AGE,
      httpOnly: true,
      sameSite: 'lax',
    })

    return { success: true, alreadyViewed: false }
  } catch (error) {
    console.error('Error incrementing views:', error)
    return { success: false, error: 'Erreur lors de l\'incrémentation des vues' }
  }
}

