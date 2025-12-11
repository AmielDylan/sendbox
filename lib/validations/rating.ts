/**
 * Schéma de validation pour les ratings
 */

import { z } from 'zod'

export const ratingSchema = z.object({
  booking_id: z.string().uuid('ID de réservation invalide'),
  rating: z
    .number()
    .min(1, 'Minimum 1 étoile')
    .max(5, 'Maximum 5 étoiles')
    .int('Le rating doit être un nombre entier'),
  comment: z
    .string()
    .min(10, 'Le commentaire doit contenir au moins 10 caractères')
    .max(500, 'Le commentaire ne peut pas dépasser 500 caractères')
    .optional(),
})

export type RatingInput = z.infer<typeof ratingSchema>

// Suggestions rapides pour les badges
export const RATING_SUGGESTIONS = [
  'Ponctuel ✓',
  'Soigneux ✓',
  'Communique bien ✓',
  'Professionnel ✓',
  'Très satisfait ✓',
  'Recommandé ✓',
] as const




