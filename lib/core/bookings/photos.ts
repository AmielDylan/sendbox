/**
 * Utilitaires pour l'upload des photos de colis (côté client uniquement)
 * Le traitement avec Sharp est fait côté serveur dans les Server Actions
 */

const MAX_FILE_SIZE = 5_000_000 // 5 MB
const MAX_PHOTOS = 5
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/**
 * Valide un fichier photo de colis (côté client)
 */
export function validatePackagePhoto(file: File): {
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
      error: 'Fichier trop volumineux (maximum 5 MB)',
    }
  }

  return { valid: true }
}

/**
 * Génère un nom de fichier sécurisé pour une photo de colis
 */
export function generatePackagePhotoFileName(
  bookingId: string,
  index: number
): string {
  const timestamp = Date.now()
  return `${bookingId}/photo_${index}_${timestamp}.jpg`
}

export { MAX_FILE_SIZE, MAX_PHOTOS, ACCEPTED_TYPES }
