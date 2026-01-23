/**
 * Utilitaires pour la génération et validation des QR codes
 */

import { createClient } from "@/lib/shared/db/server"
import { createHash, randomBytes } from 'crypto'

/**
 * Génère un QR code unique pour un booking
 */
export async function generateBookingQRCode(bookingId: string): Promise<string> {
  // Générer une chaîne unique
  const timestamp = Date.now()
  const random = randomBytes(16).toString('hex')
  const rawString = `booking_${bookingId}_${timestamp}_${random}`

  // Hash pour sécurité et longueur fixe
  const hash = createHash('sha256').update(rawString).digest('hex')

  // Format: SENDBOX-{8 premiers caractères du hash}-{4 derniers}
  const qrCode = `SENDBOX-${hash.substring(0, 8)}-${hash.substring(hash.length - 4)}`

  // Mettre à jour le booking avec le QR code
  const supabase = await createClient()
  const { error } = await supabase
    .from('bookings')
    .update({ qr_code: qrCode })
    .eq('id', bookingId)

  if (error) {
    console.error('Error updating booking with QR code:', error)
    throw new Error('Failed to generate QR code')
  }

  return qrCode
}

/**
 * Valide un QR code scanné contre le QR code stocké
 */
export function validateQRCode(
  scannedCode: string,
  bookingQRCode: string
): boolean {
  // Comparaison stricte
  return scannedCode.trim().toUpperCase() === bookingQRCode.trim().toUpperCase()
}


