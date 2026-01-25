/**
 * Schémas de validation Zod pour le KYC
 */

import { z } from 'zod'
import { subYears } from 'date-fns'

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
})

export type StripeIdentityInput = z.infer<typeof stripeIdentitySchema>

// Types MIME acceptés
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'application/pdf']
const MAX_FILE_SIZE = 5_000_000 // 5 MB
const MAX_FILE_SIZE_COMPRESSED = 2_000_000 // 2 MB (seuil de compression)

// Validation de fichier
const fileSchema = z
  .instanceof(File, { message: 'Fichier requis' })
  .refine(file => file.size <= MAX_FILE_SIZE, {
    message: 'Fichier trop volumineux (maximum 5 MB)',
  })
  .refine(file => ACCEPTED_IMAGE_TYPES.includes(file.type), {
    message: 'Format non supporté (JPEG, PNG ou PDF uniquement)',
  })

// Schéma KYC
export const kycSchema = z.object({
  documentType: z.enum(DOCUMENT_TYPES, {
    message: 'Type de document invalide',
  }),
  documentNumber: z
    .string()
    .min(5, 'Numéro de document trop court')
    .max(20, 'Numéro de document trop long')
    .regex(/^[A-Z0-9]+$/, 'Caractères alphanumériques majuscules uniquement'),
  documentFront: fileSchema,
  documentBack: fileSchema.optional().or(z.literal('')),
  birthday: z
    .date({
      message: 'Date de naissance requise et valide',
    })
    .max(subYears(new Date(), 18), 'Vous devez avoir au moins 18 ans')
    .min(subYears(new Date(), 120), 'Date de naissance invalide'),
  nationality: z
    .string()
    .min(2, 'Nationalité requise')
    .max(3, 'Code pays invalide (ISO 3166-1 alpha-2 ou alpha-3)'),
  address: z
    .string()
    .min(10, 'Adresse complète requise (minimum 10 caractères)')
    .max(200, 'Adresse trop longue'),
})

export type KYCInput = z.infer<typeof kycSchema>

// Schéma pour l'approbation/rejet admin
export const kycReviewSchema = z.object({
  profileId: z.string().uuid('ID de profil invalide'),
  action: z.enum(['approve', 'reject'], {
    message: 'Action invalide',
  }),
  rejectionReason: z.string().optional(),
})

export type KYCReviewInput = z.infer<typeof kycReviewSchema>

// Constantes exportées
export { MAX_FILE_SIZE, MAX_FILE_SIZE_COMPRESSED, ACCEPTED_IMAGE_TYPES }
