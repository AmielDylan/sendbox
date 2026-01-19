/**
 * Utilitaires pour les avatars (côté client uniquement)
 * Le traitement avec Sharp est fait côté serveur dans les Server Actions
 */

const MAX_FILE_SIZE = 2_000_000 // 2 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const DICEBEAR_BASE_URL = 'https://api.dicebear.com/9.x/thumbs/svg'

/**
 * Valide un fichier avatar (côté client)
 */
export function validateAvatarFile(file: File): {
  valid: boolean
  error?: string
} {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Format non supporté (JPEG, PNG ou WebP uniquement)',
    }
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'Fichier trop volumineux (maximum 2 MB)',
    }
  }

  return { valid: true }
}

/**
 * Génère un nom de fichier sécurisé pour l'avatar
 */
export function generateAvatarFileName(userId: string): string {
  const timestamp = Date.now()
  return `${userId}/avatar_${timestamp}.jpg`
}

/**
 * Retourne une URL d'avatar valide (ou un fallback Dicebear)
 */
export function getAvatarUrl(
  avatarUrl: string | null | undefined,
  seed: string | null | undefined
): string {
  if (avatarUrl && avatarUrl.trim().length > 0) {
    return avatarUrl
  }

  const safeSeed = (seed || '').trim() || 'user'
  return `${DICEBEAR_BASE_URL}?seed=${encodeURIComponent(safeSeed)}`
}

/**
 * Génère les initiales depuis un nom et prénom
 */
export function generateInitials(
  firstName: string | null,
  lastName: string | null
): string {
  const first = firstName?.[0]?.toUpperCase() || ''
  const last = lastName?.[0]?.toUpperCase() || ''
  return first + last || 'U'
}
