/**
 * Vérifie le schéma de la table announcements
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
  console.log('\n=== VÉRIFICATION SCHÉMA ANNOUNCEMENTS ===\n')

  // 1. Récupérer une annonce pour voir les colonnes disponibles
  const { data: announcement, error } = await supabase
    .from('announcements')
    .select('*')
    .limit(1)
    .single()

  if (error) {
    console.error('Erreur:', error)
    return
  }

  console.log('Colonnes disponibles dans announcements:')
  if (announcement) {
    Object.keys(announcement)
      .sort()
      .forEach(key => {
        console.log(
          `  - ${key}: ${typeof announcement[key as keyof typeof announcement]}`
        )
      })
  }

  // 2. Vérifier spécifiquement available_kg
  console.log('\n=== VÉRIFICATION available_kg ===\n')
  const { data: withAvailableKg, error: availableKgError } = await supabase
    .from('announcements')
    .select('id, available_kg')
    .limit(1)

  if (availableKgError) {
    console.error(
      '❌ Erreur lors de la sélection de available_kg:',
      availableKgError.message
    )
  } else {
    console.log('✅ La colonne available_kg existe et peut être sélectionnée')
    console.log('Valeur:', withAvailableKg)
  }

  // 3. Vérifier le typage
  console.log('\n=== TEST DANS BOOKING REQUEST ===\n')
  const { data: announcementForBooking, error: bookingError } = await supabase
    .from('announcements')
    .select('id, traveler_id, available_kg, status')
    .limit(1)
    .single()

  if (bookingError) {
    console.error('❌ Erreur:', bookingError.message)
  } else {
    console.log('✅ Succès! Structure retournée:')
    console.log(announcementForBooking)
  }
}

checkSchema().catch(console.error)
