/**
 * Schémas de validation Zod pour le profil utilisateur
 */

import { z } from 'zod'

// Schéma de mise à jour du profil
export const updateProfileSchema = z.object({
  firstname: z
    .string()
    .min(2, 'Minimum 2 caractères')
    .max(50, 'Maximum 50 caractères'),
  lastname: z
    .string()
    .min(2, 'Minimum 2 caractères')
    .max(50, 'Maximum 50 caractères'),
  phone: z
    .string()
    .regex(/^\+(?:33|229)\d{9}$/, 'Format : +33XXXXXXXXX ou +229XXXXXXXXX'),
  address: z
    .string()
    .min(10, 'Adresse complète requise (minimum 10 caractères)')
    .max(200, 'Adresse trop longue (maximum 200 caractères)'),
  bio: z
    .string()
    .max(500, 'Bio trop longue (maximum 500 caractères)')
    .optional(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

// Schéma de changement de mot de passe
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
    newPassword: z
      .string()
      .min(12, 'Minimum 12 caractères')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
        'Doit contenir majuscule, minuscule, chiffre et caractère spécial'
      ),
    confirmPassword: z.string(),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

// Schéma de changement d'email
export const changeEmailSchema = z.object({
  newEmail: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis pour confirmer'),
})

export type ChangeEmailInput = z.infer<typeof changeEmailSchema>

// Schéma de suppression de compte
export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Mot de passe requis pour confirmer'),
  confirmText: z.literal('SUPPRIMER', {
    message: 'Vous devez taper SUPPRIMER pour confirmer',
  }),
})

export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>



