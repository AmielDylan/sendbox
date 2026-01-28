/**
 * Test de création de réservation pour reproduire l'erreur
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function testBookingCreation() {
  console.log('\n=== TEST CRÉATION RÉSERVATION ===\n')

  // 1. Trouver une annonce active
  console.log("1. Recherche d'une annonce active...")
  const { data: announcement, error: announcementError } = await supabase
    .from('announcements')
    .select(
      'id, traveler_id, available_kg, status, departure_city, arrival_city, price_per_kg'
    )
    .eq('status', 'active')
    .limit(1)
    .single()

  if (announcementError || !announcement) {
    console.error(
      '❌ Erreur:',
      announcementError?.message || 'Aucune annonce trouvée'
    )
    return
  }

  console.log('✅ Annonce trouvée:', {
    id: announcement.id,
    available_kg: announcement.available_kg,
    status: announcement.status,
  })

  // 2. Tester la requête exacte qui pose problème
  console.log('\n2. Test de la requête avec jointure...')
  const { data: bookings, error: joinError } = await supabase
    .from('bookings')
    .select(
      `
      *,
      announcements:announcement_id (
        id,
        traveler_id,
        available_kg,
        status
      )
    `
    )
    .limit(1)

  if (joinError) {
    console.error('❌ Erreur lors de la jointure:', joinError.message)
    console.error('Détails:', joinError)
  } else {
    console.log('✅ Jointure réussie')
    console.log(
      'Exemple:',
      bookings?.[0]
        ? {
            booking_id: bookings[0].id,
            announcement: (bookings[0] as any).announcements,
          }
        : 'Aucune réservation'
    )
  }

  // 3. Calculer le poids réservé (comme dans le code)
  console.log('\n3. Calcul du poids réservé...')
  const { data: existingBookings, error: existingError } = await supabase
    .from('bookings')
    .select('kilos_requested, weight_kg')
    .eq('announcement_id', announcement.id)
    .in('status', ['pending', 'accepted', 'in_transit'])

  if (existingError) {
    console.error('❌ Erreur:', existingError.message)
  } else {
    const reservedWeight =
      existingBookings?.reduce(
        (sum: number, b: any) => sum + (b.kilos_requested || b.weight_kg || 0),
        0
      ) || 0
    const availableWeight = (announcement.available_kg || 0) - reservedWeight

    console.log('✅ Calcul réussi:', {
      total_capacity: announcement.available_kg,
      reserved: reservedWeight,
      available: availableWeight,
    })
  }

  console.log('\n=== FIN TEST ===\n')
}

testBookingCreation().catch(console.error)
