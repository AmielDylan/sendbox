/**
 * Utilitaires pour l'upload et le traitement de fichiers
 */

import sharp from 'sharp'
import { MAX_FILE_SIZE_COMPRESSED } from "@/lib/core/kyc/validations"

/**
 * Vérifie les magic bytes d'un fichier pour valider son type réel
 */
export async function validateFileType(
  file: File,
  allowedTypes: string[]
): Promise<boolean> {
  const buffer = await file.arrayBuffer()
  const uint8Array = new Uint8Array(buffer.slice(0, 12))

  // Magic bytes pour différents formats
  const magicBytes: Record<string, number[][]> = {
    'image/jpeg': [[0xff, 0xd8, 0xff]],
    'image/png': [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
    'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
  }

  for (const type of allowedTypes) {
    const bytes = magicBytes[type]
    if (!bytes) continue

    for (const bytePattern of bytes) {
      let matches = true
      for (let i = 0; i < bytePattern.length; i++) {
        if (uint8Array[i] !== bytePattern[i]) {
          matches = false
          break
        }
      }
      if (matches) return true
    }
  }

  return false
}

/**
 * Compresse une image si nécessaire et supprime les métadonnées EXIF
 */
export async function processImage(
  file: File,
  maxSize: number = MAX_FILE_SIZE_COMPRESSED
): Promise<Buffer> {
  const buffer = Buffer.from(await file.arrayBuffer())

  // Si c'est un PDF, retourner tel quel
  if (file.type === 'application/pdf') {
    return buffer
  }

  let processedBuffer: Buffer = buffer

  // Supprimer les métadonnées EXIF et compresser si nécessaire
  try {
    const image = sharp(buffer)

    // Si l'image est déjà petite, juste supprimer les métadonnées
    if (buffer.length <= maxSize) {
      const result = await image
        .removeAlpha()
        .jpeg({ quality: 90, mozjpeg: true })
        .toBuffer()
      processedBuffer = Buffer.from(result)
    } else {
      // Compression progressive jusqu'à atteindre la taille cible
      let quality = 85
      let attempts = 0
      const maxAttempts = 5

      while (attempts < maxAttempts) {
        const result = await image
          .removeAlpha()
          .jpeg({ quality, mozjpeg: true })
          .toBuffer()

        processedBuffer = Buffer.from(result)

        if (processedBuffer.length <= maxSize || quality <= 50) {
          break
        }

        quality -= 10
        attempts++
      }
    }
  } catch (error) {
    console.error('Error processing image:', error)
    throw new Error("Erreur lors du traitement de l'image")
  }

  return processedBuffer
}

/**
 * Génère un nom de fichier sécurisé
 */
export function generateSecureFileName(
  userId: string,
  documentType: string,
  side: 'front' | 'back',
  originalName: string
): string {
  const timestamp = Date.now()
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg'
  const sanitizedExtension = extension === 'pdf' ? 'pdf' : 'jpg' // Normaliser les images en JPG

  return `${userId}/${documentType}_${side}_${timestamp}.${sanitizedExtension}`
}

/**
 * Valide la taille d'un fichier
 */
export function validateFileSize(file: File, maxSize: number): boolean {
  return file.size <= maxSize
}
