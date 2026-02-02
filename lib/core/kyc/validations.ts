/**
 * Schémas de validation Zod pour le KYC
 */

import { z } from 'zod'

// Types de documents acceptés
export const DOCUMENT_TYPES = ['passport', 'national_id'] as const
export type DocumentType = (typeof DOCUMENT_TYPES)[number]

export const stripeIdentitySchema = z.object({
  documentType: z.enum(DOCUMENT_TYPES, {
    message: 'Type de document invalide',
  }),
  documentCountry: z
    .string()
    .min(2, 'Pays du document requis')
    .max(2, 'Code pays invalide')
    .regex(/^[A-Z]{2}$/, 'Code pays invalide'),
  birthday: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date de naissance invalide'),
  address: z.string().min(3, "Adresse requise"),
  city: z.string().min(2, 'Ville requise'),
  postalCode: z.string().min(2, 'Code postal requis'),
})

export type StripeIdentityInput = z.infer<typeof stripeIdentitySchema>

// Schéma pour l'approbation/rejet admin
export const kycReviewSchema = z.object({
  profileId: z.string().uuid('ID de profil invalide'),
  action: z.enum(['approve', 'reject'], {
    message: 'Action invalide',
  }),
  rejectionReason: z.string().optional(),
})

export type KYCReviewInput = z.infer<typeof kycReviewSchema>
