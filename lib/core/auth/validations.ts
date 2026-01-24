/**
 * Schémas de validation Zod pour l'authentification
 */

import { z } from 'zod'

export const IDENTITY_DOCUMENT_TYPES = ['passport', 'national_id'] as const

// Schéma d'inscription
export const registerSchema = z
  .object({
    email: z.string().email('Email invalide'),
    password: z
      .string()
      .min(12, 'Minimum 12 caractères')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
        'Doit contenir majuscule, minuscule, chiffre et caractère spécial'
      ),
    confirmPassword: z.string(),
    firstname: z.string().min(2, 'Minimum 2 caractères').max(50),
    lastname: z.string().min(2, 'Minimum 2 caractères').max(50),
    phone: z
      .string()
      .regex(
        /^\+\d{6,15}$/,
        'Format : indicatif + numéro (6 à 15 chiffres)'
      ),
    documentType: z.enum(IDENTITY_DOCUMENT_TYPES, {
      message: 'Type de document invalide',
    }),
    documentCountry: z
      .string()
      .min(2, 'Pays du document requis')
      .max(2, 'Code pays invalide')
      .regex(/^[A-Z]{2}$/, 'Code pays invalide'),
    terms: z.boolean().refine(val => val === true, {
      message: 'Vous devez accepter les CGU',
    }),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

export type RegisterInput = z.infer<typeof registerSchema>

// Schéma de connexion
export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
  rememberMe: z.boolean(),
})

export type LoginInput = z.infer<typeof loginSchema>

// Schéma de demande de réinitialisation
export const resetPasswordRequestSchema = z.object({
  email: z.string().email('Email invalide'),
})

export type ResetPasswordRequestInput = z.infer<
  typeof resetPasswordRequestSchema
>

// Schéma de réinitialisation avec token
export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(12, 'Minimum 12 caractères')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
        'Doit contenir majuscule, minuscule, chiffre et caractère spécial'
      ),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
