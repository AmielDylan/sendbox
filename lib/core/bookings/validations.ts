/**
 * Schemas de validation Zod pour les reservations.
 */

import { z } from 'zod'
import { PACKAGE_CATEGORIES } from '@/lib/core/bookings/package-safety'

export const createBookingSchema = z.object({
  announcement_id: z.string().uuid("ID d'annonce invalide"),
  kilos_requested: z
    .number()
    .min(0.5, 'Minimum 0.5 kg')
    .max(30, 'Maximum 30 kg'),
  package_description: z
    .string()
    .min(10, 'Description requise (minimum 10 caracteres)')
    .max(500, 'Description trop longue (maximum 500 caracteres)'),
  package_category: z.enum(PACKAGE_CATEGORIES, {
    message: 'Categorie du colis requise',
  }),
  package_dimensions: z
    .string()
    .min(3, 'Dimensions approximatives requises')
    .max(120, 'Dimensions trop longues (maximum 120 caracteres)'),
  forbidden_items_acknowledged: z.boolean().refine(Boolean, {
    message:
      'Vous devez confirmer que le colis ne contient aucun objet interdit',
  }),
  content_truth_attested: z.boolean().refine(Boolean, {
    message: 'Vous devez attester que la declaration du contenu est exacte',
  }),
  package_value: z
    .number()
    .min(0, 'Valeur minimale : 0 EUR')
    .max(10000, 'Valeur maximale : 10 000 EUR'),
  package_photos: z
    .array(z.instanceof(File))
    .max(5, 'Maximum 5 photos')
    .optional(),
  insurance_opted: z.boolean(),
})

export type CreateBookingInput = z.infer<typeof createBookingSchema>

export const COMMISSION_RATE = 0.03
export const INSURANCE_RATE = 0.03
export const INSURANCE_BASE_FEE = 0
export const MAX_INSURANCE_COVERAGE = 500
