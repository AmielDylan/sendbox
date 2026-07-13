/**
 * Schema de validation pour les ratings
 */

import { z } from 'zod'

export type ReviewRole = 'sender' | 'traveler'

export const REVIEW_CRITERIA_BY_ROLE = {
  sender: [
    'Communication claire',
    'Ponctualite respectee',
    'Colis transporte avec soin',
    'Remise ou livraison conforme',
    'Voyageur recommande',
  ],
  traveler: [
    'Declaration colis claire',
    'Colis conforme a la declaration',
    'Remise ponctuelle',
    'Communication claire',
    'Expediteur recommande',
  ],
} as const

export const ALL_REVIEW_CRITERIA = [
  ...REVIEW_CRITERIA_BY_ROLE.sender,
  ...REVIEW_CRITERIA_BY_ROLE.traveler,
] as const

export const ratingSchema = z.object({
  booking_id: z.string().uuid('ID de reservation invalide'),
  rating: z
    .number()
    .min(1, 'Minimum 1 etoile')
    .max(5, 'Maximum 5 etoiles')
    .int('La note doit etre un nombre entier'),
  comment: z
    .string()
    .trim()
    .min(20, 'Le commentaire doit contenir au moins 20 caracteres')
    .max(500, 'Le commentaire ne peut pas depasser 500 caracteres'),
  criteria: z
    .array(z.enum(ALL_REVIEW_CRITERIA))
    .min(1, 'Selectionnez au moins un critere')
    .max(4, 'Selectionnez 4 criteres maximum'),
})

export type RatingInput = z.infer<typeof ratingSchema>

export function getReviewCriteriaForRole(role: ReviewRole) {
  return REVIEW_CRITERIA_BY_ROLE[role]
}

export function filterReviewCriteriaForRole(
  criteria: readonly string[],
  role: ReviewRole
) {
  const allowed = new Set<string>(REVIEW_CRITERIA_BY_ROLE[role])
  return criteria.filter(criterion => allowed.has(criterion))
}

export function formatReviewComment(comment: string, criteria: string[]) {
  return [`Criteres : ${criteria.join(', ')}`, comment.trim()].join('\n\n')
}
