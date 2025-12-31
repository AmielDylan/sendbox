/**
 * Composant client pour incrémenter les vues d'annonce
 * Doit être un client component car il appelle une Server Action qui modifie les cookies
 */

'use client'

import { useEffect } from 'react'
import { incrementAnnouncementViews } from '@/lib/core/announcements/views'

interface ViewTrackerProps {
  announcementId: string
}

export function ViewTracker({ announcementId }: ViewTrackerProps) {
  useEffect(() => {
    // Incrémenter les vues après le montage du composant
    incrementAnnouncementViews(announcementId).catch((error) => {
      console.error('Error tracking view:', error)
    })
  }, [announcementId])

  // Ce composant ne rend rien
  return null
}
