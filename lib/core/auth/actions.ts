/**
 * Server Actions pour l'authentification
 * Utilise Supabase Auth avec validation Zod côté serveur
 */

'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/shared/db/server'
import { createAdminClient } from '@/lib/shared/db/admin'
import {
  registerSchema,
  loginSchema,
  resetPasswordRequestSchema,
  resetPasswordSchema,
  type RegisterInput,
  type LoginInput,
  type ResetPasswordRequestInput,
  type ResetPasswordInput,
} from '@/lib/core/auth/validations'
import { authRateLimit } from '@/lib/shared/security/rate-limit'

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
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email`,
        data: {
          firstname: validation.data.firstname,
          lastname: validation.data.lastname,
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

    if (authData.user) {
      // Attendre un peu pour que le trigger s'exécute
      await new Promise(resolve => setTimeout(resolve, 500))

      const profileUpdates: Record<string, unknown> = {
        firstname: validation.data.firstname,
        lastname: validation.data.lastname,
        phone: validation.data.phone,
        kyc_status: 'incomplete',
      }

      let updatedProfiles: Array<{ id: string }> | null = null
      const { data: initialProfiles, error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', authData.user.id)
        .select('id')

      updatedProfiles = initialProfiles as Array<{ id: string }> | null

      if (profileError) {
        console.error('Error updating profile:', profileError)
      }

      if (!updatedProfiles || updatedProfiles.length === 0) {
        await new Promise(resolve => setTimeout(resolve, 300))

        const retryResult = await supabase
          .from('profiles')
          .update(profileUpdates)
          .eq('id', authData.user.id)
          .select('id')

        updatedProfiles = retryResult.data as Array<{ id: string }> | null
        if (retryResult.error) {
          console.error('Error retrying profile update:', retryResult.error)
        }
      }

      if (!updatedProfiles || updatedProfiles.length === 0) {
        try {
          const adminClient = process.env.SUPABASE_SERVICE_ROLE_KEY
            ? createAdminClient()
            : null
          let canInsertProfile = true
          if (adminClient) {
            const { data: adminUser, error: adminError } =
              await adminClient.auth.admin.getUserById(authData.user.id)
            if (adminError || !adminUser?.user) {
              console.warn(
                'Auth user not found yet, skipping profile fallback insert'
              )
              canInsertProfile = false
            }
          }
          if (canInsertProfile) {
            const client = adminClient || supabase
            const { error: insertError } = await client
              .from('profiles')
              .insert({
                id: authData.user.id,
                email: validation.data.email,
                firstname: validation.data.firstname,
                lastname: validation.data.lastname,
                phone: validation.data.phone,
                kyc_status: 'incomplete',
              })

            if (insertError) {
              if ((insertError as any)?.code === '23503') {
                console.warn(
                  'Profile fallback insert skipped: auth user not present yet'
                )
              } else {
                console.error('Error inserting profile fallback:', insertError)
              }
            }
          }
        } catch (insertError) {
          console.error('Error inserting profile fallback:', insertError)
        }
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

    // Retourner succès pour redirection côté client
    // (redirect() ne fonctionne pas depuis Server Action appelée côté client)
    return {
      success: true,
      redirectTo: '/dashboard',
    }
  } catch (error) {
    console.error('Sign in error:', error)
    return {
      error: 'Une erreur est survenue. Veuillez réessayer.',
      field: 'unknown',
    }
  }
}

/**
 * Déconnexion (avec redirect)
 */
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

/**
 * Déconnexion serveur (sans redirect - pour utilisation côté client)
 */
export async function signOutServer() {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()

  const supabase = await createClient()

  // Utiliser scope: 'global' pour nettoyer tous les tokens et cookies
  await supabase.auth.signOut({ scope: 'global' })

  // Supprimer manuellement tous les cookies Supabase
  const allCookies = cookieStore.getAll()
  allCookies.forEach(cookie => {
    if (cookie.name.startsWith('sb-')) {
      cookieStore.delete(cookie.name)
    }
  })

  revalidatePath('/', 'layout')
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
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password`,
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
    redirect('/login?message=password-reset-success')
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
 * Supabase gère la vérification automatiquement via l'URL de redirection
 * Quand l'utilisateur clique sur le lien, Supabase vérifie automatiquement
 * Cette fonction vérifie simplement que l'utilisateur est maintenant vérifié
 */
export async function verifyEmail(token?: string, type?: string) {
  const supabase = await createClient()

  try {
    // Vérifier l'état actuel de l'utilisateur
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    // Si pas d'utilisateur connecté, essayer de vérifier avec le token
    if ((userError || !user) && token && type) {
      // Essayer de vérifier avec le token directement
      const { data: verifyData, error: verifyError } =
        await supabase.auth.verifyOtp({
          token_hash: token,
          type: type as 'email',
        })

      if (verifyError) {
        return {
          error: 'Le lien de vérification est invalide ou a expiré.',
        }
      }

      // Si la vérification réussit, récupérer l'utilisateur
      if (verifyData.user) {
        revalidatePath('/', 'layout')
        return {
          success: true,
          redirectTo: '/dashboard?verified=true',
        }
      }
    }

    // Si l'utilisateur est déjà vérifié, c'est bon
    if (user?.email_confirmed_at) {
      revalidatePath('/', 'layout')
      return {
        success: true,
        redirectTo: '/dashboard?verified=true',
      }
    }

    // Si un token est fourni et utilisateur connecté, essayer de vérifier
    if (token && type && user) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: type as 'email',
      })

      if (error) {
        return {
          error: 'Le lien de vérification est invalide ou a expiré.',
        }
      }

      // Vérifier à nouveau que l'email est maintenant vérifié
      const {
        data: { user: updatedUser },
      } = await supabase.auth.getUser()

      if (updatedUser?.email_confirmed_at) {
        revalidatePath('/', 'layout')
        return {
          success: true,
          redirectTo: '/dashboard?verified=true',
        }
      }
    }

    // Si pas de token mais utilisateur connecté, vérifier l'état
    if (user) {
      revalidatePath('/', 'layout')

      // Attendre un peu pour que la session soit mise à jour
      await new Promise(resolve => setTimeout(resolve, 1000))

      const {
        data: { user: finalUser },
      } = await supabase.auth.getUser()

      if (finalUser?.email_confirmed_at) {
        return {
          success: true,
          redirectTo: '/dashboard?verified=true',
        }
      }
    }

    return {
      error: "La vérification n'a pas pu être complétée. Veuillez réessayer.",
    }
  } catch (error) {
    console.error('Verify email error:', error)
    return {
      error: 'Une erreur est survenue. Veuillez réessayer.',
    }
  }
}
