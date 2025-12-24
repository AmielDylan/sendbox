/**
 * Schémas de validation Zod pour les réservations
 */

import { z } from 'zod'

// Schéma de création de réservation
export const createBookingSchema = z.object({
  announcement_id: z.string().uuid('ID d\'annonce invalide'),
  kilos_requested: z
    .number()
    .min(0.5, 'Minimum 0.5 kg')
    .max(30, 'Maximum 30 kg'),
  package_description: z
    .string()
    .min(10, 'Description requise (minimum 10 caractères)')
    .max(500, 'Description trop longue (maximum 500 caractères)'),
  package_value: z
    .number()
    .min(0, 'Valeur minimale : 0 €')
    .max(10000, 'Valeur maximale : 10 000 €'),
  package_photos: z
    .array(z.instanceof(File))
    .max(5, 'Maximum 5 photos')
    .optional(),
  insurance_opted: z.boolean(),
})

export type CreateBookingInput = z.infer<typeof createBookingSchema>

// Constantes pour les calculs
export const COMMISSION_RATE = 0.12 // 12%
export const INSURANCE_RATE = 0.015 // 1.5%
export const INSURANCE_BASE_FEE = 2 // 2 EUR
export const MAX_INSURANCE_COVERAGE = 500 // EUR

