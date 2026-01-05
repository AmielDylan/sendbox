/**
 * Script pour supprimer et régénérer un contrat PDF
 * Usage: npx tsx scripts/regenerate-contract.ts <booking_id>
 */

import { createClient } from '@supabase/supabase-js'
import { generateTransportContract } from '../lib/shared/services/pdf/generation'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function regenerateContract(bookingId: string) {
  console.log(`🔄 Régénération du contrat pour booking: ${bookingId}`)

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // 1. Récupérer le QR code du booking
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('qr_code')
    .eq('id', bookingId)
    .single()

  if (bookingError || !booking) {
    console.error('❌ Erreur: Booking introuvable', bookingError)
    process.exit(1)
  }

  if (!booking.qr_code) {
    console.error('❌ Erreur: QR code manquant pour ce booking')
    process.exit(1)
  }

  const fileName = `contract-${booking.qr_code}.pdf`
  const filePath = `${bookingId}/${fileName}`

  // 2. Supprimer l'ancien fichier s'il existe
  console.log(`🗑️  Suppression de l'ancien contrat: ${filePath}`)

  const { error: deleteError } = await supabase.storage
    .from('contracts')
    .remove([filePath])

  if (deleteError) {
    console.warn('⚠️  Attention: Erreur lors de la suppression (le fichier n\'existe peut-être pas):', deleteError.message)
  } else {
    console.log('✅ Ancien contrat supprimé')
  }

  // 3. Régénérer le contrat
  console.log('📝 Génération du nouveau contrat...')

  const result = await generateTransportContract(bookingId)

  if (result.error) {
    console.error('❌ Erreur lors de la génération:', result.error)
    process.exit(1)
  }

  console.log('✅ Nouveau contrat généré avec succès!')
  console.log(`📄 Fichier: ${result.fileName}`)
  console.log(`🔗 URL: ${result.url?.substring(0, 80)}...`)

  process.exit(0)
}

const bookingId = process.argv[2]

if (!bookingId) {
  console.error('❌ Erreur: Veuillez fournir un booking ID')
  console.log('Usage: npx tsx scripts/regenerate-contract.ts <booking_id>')
  process.exit(1)
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Erreur: Variables d\'environnement manquantes')
  console.log('Assurez-vous que NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont définis')
  process.exit(1)
}

regenerateContract(bookingId)
