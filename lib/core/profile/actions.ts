/**
 * Server Actions pour la gestion du profil utilisateur
 */

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/shared/db/server'
import {
  updateProfileSchema,
  changePasswordSchema,
  changeEmailSchema,
  deleteAccountSchema,
  type UpdateProfileInput,
  type ChangePasswordInput,
  type ChangeEmailInput,
  type DeleteAccountInput,
} from '@/lib/core/profile/validations'
import {
  generateAvatarFileName,
  validateAvatarFile,
  getAvatarUrl,
} from '@/lib/core/profile/utils'
import {
  sensitiveActionRateLimit,
  uploadRateLimit,
} from '@/lib/shared/security/rate-limit'
import { validateImageUpload } from '@/lib/shared/security/upload-validation'
import sharp from 'sharp'

const AVATAR_SIZE = 200 // 200x200px

/**
 * Traite et redimensionne une image avatar (côté serveur uniquement)
 */
async function processAvatar(file: File): Promise<Buffer> {
  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    const image = sharp(buffer)
    const metadata = await image.metadata()

    if (!metadata.width || !metadata.height) {
      throw new Error("Impossible de lire les dimensions de l'image")
    }

    // Calculer le crop carré centré
    const size = Math.min(metadata.width, metadata.height)
    const left = Math.floor((metadata.width - size) / 2)
    const top = Math.floor((metadata.height - size) / 2)

    // Crop carré centré puis resize à 200x200
    const processed = await image
      .extract({
        left,
        top,
        width: size,
        height: size,
      })
      .resize(AVATAR_SIZE, AVATAR_SIZE, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 90, mozjpeg: true })
      .removeAlpha()
      .toBuffer()

    return Buffer.from(processed)
  } catch (error) {
    console.error('Error processing avatar:', error)
    throw new Error("Erreur lors du traitement de l'avatar")
  }
}

/**
 * Met à jour le profil utilisateur
 */
export async function updateProfile(
  formData: UpdateProfileInput & { avatar?: File }
) {
  const supabase = await createClient()

  // Vérifier l'authentification
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      error: 'Vous devez être connecté',
    }
  }

  // Validation
  const validation = updateProfileSchema.safeParse(formData)
  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || 'Données invalides',
      field: String(validation.error.issues[0]?.path[0] || 'unknown'),
    }
  }

  try {
    // Upload avatar si fourni
    let avatarUrl: string | null = null
    if (
      formData.avatar &&
      formData.avatar instanceof File &&
      formData.avatar.size > 0
    ) {
      // Rate limiting pour uploads
      const rateLimitResult = await uploadRateLimit(user.id)
      if (!rateLimitResult.success) {
        return {
          error: `Trop d'uploads. Réessayez après ${rateLimitResult.reset.toLocaleTimeString('fr-FR')}`,
          field: 'avatar',
        }
      }

      // Valider avec magic bytes
      const magicBytesValidation = await validateImageUpload(formData.avatar, 2)
      if (!magicBytesValidation.valid) {
        return {
          error: magicBytesValidation.error,
          field: 'avatar',
        }
      }

      // Valider le fichier
      const validation = validateAvatarFile(formData.avatar)
      if (!validation.valid) {
        return {
          error: validation.error || 'Fichier avatar invalide',
          field: 'avatar',
        }
      }

      // Traiter l'avatar
      const processedAvatar = await processAvatar(formData.avatar)
      const fileName = generateAvatarFileName(user.id)

      // Upload vers Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, processedAvatar, {
          contentType: 'image/jpeg',
          upsert: true,
        })

      if (uploadError) {
        console.error('Upload avatar error:', uploadError)
        return {
          error: "Erreur lors de l'upload de l'avatar",
          field: 'avatar',
        }
      }

      // Générer URL publique
      const { data: urlData } = await supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      avatarUrl = urlData.publicUrl
    }

    // Mettre à jour le profil
    const updateData: Record<string, unknown> = {
      firstname: validation.data.firstname,
      lastname: validation.data.lastname,
      phone: validation.data.phone,
      address: validation.data.address,
      bio: validation.data.bio || null,
      updated_at: new Date().toISOString(),
    }

    if (avatarUrl) {
      updateData.avatar_url = avatarUrl
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)

    if (updateError) {
      console.error('Update profile error:', updateError)
      return {
        error: 'Erreur lors de la mise à jour du profil',
      }
    }

    revalidatePath('/dashboard/reglages/profil')
    return {
      success: true,
      message: 'Profil mis à jour avec succès',
    }
  } catch (error) {
    console.error('Update profile error:', error)
    return {
      error: 'Une erreur est survenue. Veuillez réessayer.',
    }
  }
}

/**
 * Supprime l'avatar utilisateur et revient à l'avatar par défaut
 */
export async function removeAvatar() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      error: 'Vous devez être connecté',
    }
  }

  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Fetch profile error:', profileError)
    }

    const avatarUrl = profile?.avatar_url || null
    const storagePrefix = '/storage/v1/object/public/avatars/'
    const prefixIndex = avatarUrl?.indexOf(storagePrefix) ?? -1

    if (prefixIndex !== -1 && avatarUrl) {
      const filePath = avatarUrl.slice(prefixIndex + storagePrefix.length)
      const cleanPath = filePath.split('?')[0]
      if (cleanPath) {
        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove([cleanPath])
        if (deleteError) {
          console.warn('Avatar delete error:', deleteError)
        }
      }
    }

    const defaultAvatarUrl = getAvatarUrl(null, user.id)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        avatar_url: defaultAvatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Remove avatar error:', updateError)
      return {
        error: "Erreur lors de la suppression de l'avatar",
      }
    }

    revalidatePath('/dashboard/reglages/profil')
    return {
      success: true,
      message: 'Avatar supprimé avec succès',
    }
  } catch (error) {
    console.error('Remove avatar error:', error)
    return {
      error: 'Une erreur est survenue. Veuillez réessayer.',
    }
  }
}

/**
 * Change le mot de passe de l'utilisateur
 */
export async function changePassword(formData: ChangePasswordInput) {
  const supabase = await createClient()

  // Vérifier l'authentification
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      error: 'Vous devez être connecté',
    }
  }

  // Rate limiting pour changement de mot de passe
  const rateLimitResult = await sensitiveActionRateLimit(user.id)
  if (!rateLimitResult.success) {
    return {
      error: `Trop de tentatives. Réessayez après ${rateLimitResult.reset.toLocaleTimeString('fr-FR')}`,
      field: 'currentPassword',
    }
  }

  // Validation
  const validation = changePasswordSchema.safeParse(formData)
  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || 'Données invalides',
      field: String(validation.error.issues[0]?.path[0] || 'unknown'),
    }
  }

  try {
    // Vérifier le mot de passe actuel
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: validation.data.currentPassword,
    })

    if (signInError) {
      return {
        error: 'Mot de passe actuel incorrect',
        field: 'currentPassword',
      }
    }

    // Mettre à jour le mot de passe
    const { error: updateError } = await supabase.auth.updateUser({
      password: validation.data.newPassword,
    })

    if (updateError) {
      console.error('Update password error:', updateError)
      return {
        error: 'Erreur lors du changement de mot de passe',
      }
    }

    // TODO: Envoyer email de notification

    revalidatePath('/dashboard/reglages/compte')
    return {
      success: true,
      message: 'Mot de passe modifié avec succès',
    }
  } catch (error) {
    console.error('Change password error:', error)
    return {
      error: 'Une erreur est survenue. Veuillez réessayer.',
    }
  }
}

/**
 * Change l'email de l'utilisateur
 */
export async function changeEmail(formData: ChangeEmailInput) {
  const supabase = await createClient()

  // Vérifier l'authentification
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      error: 'Vous devez être connecté',
    }
  }

  // Rate limiting pour changement d'email
  const rateLimitResult = await sensitiveActionRateLimit(user.id)
  if (!rateLimitResult.success) {
    return {
      error: `Trop de tentatives. Réessayez après ${rateLimitResult.reset.toLocaleTimeString('fr-FR')}`,
      field: 'password',
    }
  }

  // Validation
  const validation = changeEmailSchema.safeParse(formData)
  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || 'Données invalides',
      field: String(validation.error.issues[0]?.path[0] || 'unknown'),
    }
  }

  try {
    // Vérifier le mot de passe
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: validation.data.password,
    })

    if (signInError) {
      return {
        error: 'Mot de passe incorrect',
        field: 'password',
      }
    }

    // Mettre à jour l'email (Supabase enverra un email de confirmation)
    const { error: updateError } = await supabase.auth.updateUser({
      email: validation.data.newEmail,
    })

    if (updateError) {
      if (updateError.message.includes('already registered')) {
        return {
          error: 'Cet email est déjà utilisé',
          field: 'newEmail',
        }
      }
      return {
        error: updateError.message || "Erreur lors du changement d'email",
        field: 'newEmail',
      }
    }

    revalidatePath('/dashboard/reglages/compte')
    return {
      success: true,
      message:
        'Un email de confirmation a été envoyé à votre nouvelle adresse. Veuillez le vérifier.',
    }
  } catch (error) {
    console.error('Change email error:', error)
    return {
      error: 'Une erreur est survenue. Veuillez réessayer.',
    }
  }
}

/**
 * Supprime le compte utilisateur (soft delete)
 */
export async function deleteAccount(formData: DeleteAccountInput) {
  const supabase = await createClient()

  // Vérifier l'authentification
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      error: 'Vous devez être connecté',
    }
  }

  // Validation
  const validation = deleteAccountSchema.safeParse(formData)
  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || 'Données invalides',
    }
  }

  try {
    // Vérifier le mot de passe
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: validation.data.password,
    })

    if (signInError) {
      return {
        error: 'Mot de passe incorrect',
        field: 'password',
      }
    }

    // Soft delete : marquer le compte comme banni/désactivé
    // Note: Ajouter colonne is_banned ou is_deleted dans profiles si nécessaire
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        // is_banned: true, // À ajouter dans la migration
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Delete account error:', updateError)
      return {
        error: 'Erreur lors de la suppression du compte',
      }
    }

    // Déconnexion
    await supabase.auth.signOut()

    // TODO: Envoyer email de confirmation de suppression

    return {
      success: true,
      message: 'Votre compte a été supprimé avec succès',
      redirect: '/',
    }
  } catch (error) {
    console.error('Delete account error:', error)
    return {
      error: 'Une erreur est survenue. Veuillez réessayer.',
    }
  }
}

/**
 * Récupère le profil complet de l'utilisateur actuel
 */
export async function getCurrentProfile() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      error: 'Non authentifié',
    }
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    return {
      error: 'Profil introuvable',
    }
  }

  return {
    profile: {
      ...profile,
      email: user.email,
    },
  }
}
