/**
 * Validation sécurisée des uploads de fichiers
 * Utilise magic bytes pour vérifier le type réel du fichier
 */

import { fileTypeFromBuffer } from 'file-type'

export interface UploadValidationOptions {
  maxSize: number // en bytes
  allowedMimeTypes: string[]
  allowedExtensions?: string[]
}

/**
 * Valide un fichier uploadé avec vérification magic bytes
 */
export async function validateUpload(
  file: File,
  options: UploadValidationOptions
): Promise<{ valid: boolean; error?: string }> {
  try {
    // 1. Vérifier la taille
    if (file.size > options.maxSize) {
      return {
        valid: false,
        error: `Fichier trop volumineux (max ${(options.maxSize / 1_000_000).toFixed(2)} MB)`,
      }
    }

    // 2. Vérifier le type MIME déclaré
    if (!options.allowedMimeTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Type de fichier non autorisé. Types acceptés : ${options.allowedMimeTypes.join(', ')}`,
      }
    }

    // 3. Vérifier les magic bytes (type réel du fichier)
    const buffer = Buffer.from(await file.arrayBuffer())
    const fileType = await fileTypeFromBuffer(buffer)

    if (!fileType) {
      // Certains fichiers peuvent ne pas être détectés (ex: PDF)
      // Dans ce cas, on vérifie l'extension
      if (options.allowedExtensions) {
        const extension = file.name.split('.').pop()?.toLowerCase()
        if (!extension || !options.allowedExtensions.includes(extension)) {
          return {
            valid: false,
            error: 'Type de fichier non détecté ou non autorisé',
          }
        }
      } else {
        return {
          valid: false,
          error: 'Impossible de vérifier le type de fichier',
        }
      }
    } else {
      // Vérifier que le type détecté correspond aux types autorisés
      if (!options.allowedMimeTypes.includes(fileType.mime)) {
        return {
          valid: false,
          error: `Type de fichier détecté (${fileType.mime}) ne correspond pas au type déclaré (${file.type})`,
        }
      }
    }

    // 4. Vérifications supplémentaires pour les images
    if (file.type.startsWith('image/')) {
      // Vérifier que c'est bien une image valide
      if (!fileType || !fileType.mime.startsWith('image/')) {
        return {
          valid: false,
          error: 'Le fichier n\'est pas une image valide',
        }
      }
    }

    // 5. Vérifications supplémentaires pour les PDF
    if (file.type === 'application/pdf') {
      // Vérifier les premiers bytes d'un PDF (%PDF)
      const pdfHeader = buffer.slice(0, 4).toString('ascii')
      if (pdfHeader !== '%PDF') {
        return {
          valid: false,
          error: 'Le fichier n\'est pas un PDF valide',
        }
      }
    }

    return { valid: true }
  } catch (error) {
    console.error('Error validating upload:', error)
    return {
      valid: false,
      error: 'Erreur lors de la validation du fichier',
    }
  }
}

/**
 * Valide un fichier image avec options spécifiques
 */
export async function validateImageUpload(file: File, maxSizeMB: number = 5) {
  return validateUpload(file, {
    maxSize: maxSizeMB * 1_000_000,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
  })
}

/**
 * Valide un fichier PDF avec options spécifiques
 */
export async function validatePDFUpload(file: File, maxSizeMB: number = 5) {
  return validateUpload(file, {
    maxSize: maxSizeMB * 1_000_000,
    allowedMimeTypes: ['application/pdf'],
    allowedExtensions: ['pdf'],
  })
}

/**
 * Valide un document KYC (image ou PDF)
 */
export async function validateKYCDocument(file: File, maxSizeMB: number = 5) {
  return validateUpload(file, {
    maxSize: maxSizeMB * 1_000_000,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf'],
  })
}

