/**
 * Server Actions pour l'authentification
 * Utilise Supabase Auth avec validation Zod côté serveur
 */

'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  registerSchema,
  loginSchema,
  resetPasswordRequestSchema,
  resetPasswordSchema,
  type RegisterInput,
  type LoginInput,
  type ResetPasswordRequestInput,
  type ResetPasswordInput,
} from '@/lib/validations/auth'
import { authRateLimit } from '@/lib/security/rate-limit'

// Messages d'erreur génériques pour éviter l'énumération
const GENERIC_ERROR_MESSAGE =
  'Email ou mot de passe incorrect. Veuillez réessayer.'

/**
 * Inscription d'un nouvel utilisateur
 */
export async function signUp(formData: RegisterInput) {
  // Validation côté serveur
  const validation = registerSchema.safeParse(formData)
  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || 'Données invalides',
      field: String(validation.error.issues[0]?.path[0] || 'unknown'),
    }
  }

  const supabase = await createClient()

  try {
    // Créer l'utilisateur dans Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validation.data.email,
      password: validation.data.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/verify-email`,
        data: {
          first_name: validation.data.firstname,
          last_name: validation.data.lastname,
          phone: validation.data.phone,
        },
      },
    })

    if (authError) {
      // Messages d'erreur génériques pour éviter l'énumération
      if (authError.message.includes('already registered')) {
        return {
          error: GENERIC_ERROR_MESSAGE,
          field: 'email',
        }
      }
      return {
        error: authError.message || GENERIC_ERROR_MESSAGE,
        field: 'email',
      }
    }

    // Le profil sera créé automatiquement via trigger PostgreSQL
    // Vérifier que le profil existe
    if (authData.user) {
      // Attendre un peu pour que le trigger s'exécute
      await new Promise(resolve => setTimeout(resolve, 500))

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: validation.data.firstname,
          last_name: validation.data.lastname,
          phone: validation.data.phone,
        })
        .eq('user_id', authData.user.id)

      if (profileError) {
        console.error('Error updating profile:', profileError)
      }
    }

    return {
      success: true,
      message:
        'Inscription réussie ! Vérifiez votre email pour confirmer votre compte.',
    }
  } catch (error) {
    console.error('Sign up error:', error)
    return {
      error: 'Une erreur est survenue. Veuillez réessayer.',
      field: 'unknown',
    }
  }
}

/**
 * Connexion d'un utilisateur
 */
export async function signIn(formData: LoginInput) {
  // Validation côté serveur
  const validation = loginSchema.safeParse(formData)
  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || 'Données invalides',
      field: String(validation.error.issues[0]?.path[0] || 'unknown'),
    }
  }

  const supabase = await createClient()

  try {
    // Rate limiting pour authentification
    const rateLimitResult = await authRateLimit(validation.data.email)
    if (!rateLimitResult.success) {
      return {
        error: `Trop de tentatives de connexion. Réessayez après ${rateLimitResult.reset.toLocaleTimeString('fr-FR')}`,
        field: 'email',
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: validation.data.email,
      password: validation.data.password,
    })

    if (error) {
      return {
        error: GENERIC_ERROR_MESSAGE,
        field: 'email',
      }
    }

    if (!data.user) {
      return {
        error: GENERIC_ERROR_MESSAGE,
        field: 'email',
      }
    }

    // Vérifier si l'email est vérifié
    if (!data.user.email_confirmed_at) {
      return {
        error: 'Veuillez vérifier votre email avant de vous connecter.',
        field: 'email',
        requiresVerification: true,
      }
    }

    // Gérer "Se souvenir de moi" via la durée de session
    // Supabase gère cela via les cookies

    revalidatePath('/', 'layout')
    redirect('/dashboard')
  } catch (error) {
    console.error('Sign in error:', error)
    return {
      error: 'Une erreur est survenue. Veuillez réessayer.',
      field: 'unknown',
    }
  }
}

/**
 * Déconnexion
 */
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

/**
 * Demande de réinitialisation de mot de passe
 */
export async function requestPasswordReset(
  formData: ResetPasswordRequestInput
) {
  // Validation côté serveur
  const validation = resetPasswordRequestSchema.safeParse(formData)
  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || 'Email invalide',
      field: 'email',
    }
  }

  const supabase = await createClient()

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(
      validation.data.email,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password`,
      }
    )

    // Toujours retourner un succès pour éviter l'énumération
    // Même si l'email n'existe pas, on ne le révèle pas
    if (error) {
      console.error('Password reset error:', error)
    }

    return {
      success: true,
      message:
        'Si cet email existe, vous recevrez un lien de réinitialisation.',
    }
  } catch (error) {
    console.error('Request password reset error:', error)
    return {
      error: 'Une erreur est survenue. Veuillez réessayer.',
      field: 'unknown',
    }
  }
}

/**
 * Réinitialisation du mot de passe avec token
 */
export async function resetPassword(
  formData: ResetPasswordInput & { token: string }
) {
  // Validation côté serveur
  const validation = resetPasswordSchema.safeParse(formData)
  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || 'Données invalides',
      field: String(validation.error.issues[0]?.path[0] || 'unknown'),
    }
  }

  const supabase = await createClient()

  try {
    // Mettre à jour le mot de passe
    const { error } = await supabase.auth.updateUser({
      password: validation.data.password,
    })

    if (error) {
      return {
        error: 'Le lien de réinitialisation est invalide ou a expiré.',
        field: 'password',
      }
    }

    revalidatePath('/', 'layout')
    redirect('/auth/login?message=password-reset-success')
  } catch (error) {
    console.error('Reset password error:', error)
    return {
      error: 'Une erreur est survenue. Veuillez réessayer.',
      field: 'unknown',
    }
  }
}

/**
 * Vérifier l'email avec le token
 * Note: Supabase gère généralement la vérification via l'URL de redirection
 * Cette fonction vérifie simplement que l'utilisateur est maintenant vérifié
 */
export async function verifyEmail(token?: string) {
  const supabase = await createClient()

  try {
    // Vérifier l'état actuel de l'utilisateur
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        error: 'Vous devez être connecté pour vérifier votre email.',
      }
    }

    // Si l'utilisateur est déjà vérifié, c'est bon
    if (user.email_confirmed_at) {
      revalidatePath('/', 'layout')
      redirect('/dashboard?verified=true')
      return
    }

    // Si un token est fourni, essayer de vérifier avec
    if (token) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email',
      })

      if (error) {
        return {
          error: 'Le lien de vérification est invalide ou a expiré.',
        }
      }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard?verified=true')
  } catch (error) {
    console.error('Verify email error:', error)
    return {
      error: 'Une erreur est survenue. Veuillez réessayer.',
    }
  }
}
