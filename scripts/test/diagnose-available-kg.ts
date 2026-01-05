/**
 * Script de diagnostic pour vérifier available_kg
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function diagnose() {
  console.log('🔍 Diagnostic de la colonne available_kg...\n')

  // Test 1: Vérifier les colonnes de la table announcements
  console.log('Test 1: Liste des colonnes de la table announcements')
  const { data: columns, error: colError } = await supabase
    .from('announcements')
    .select('*')
    .limit(0)

  if (colError) {
    console.error('❌ Erreur lors de la récupération des colonnes:', colError)
  } else {
    console.log('✅ Requête réussie')
  }

  // Test 2: Tenter de sélectionner available_kg spécifiquement
  console.log('\nTest 2: Sélection de available_kg')
  const { data: announcements, error: selectError } = await supabase
    .from('announcements')
    .select('id, available_kg, reserved_kg, price_per_kg')
    .limit(1)

  if (selectError) {
    console.error('❌ Erreur:', selectError.message)
    console.error('Détails:', selectError)
  } else {
    console.log('✅ Succès! Données:', announcements)
  }

  // Test 3: Compter les annonces
  console.log('\nTest 3: Comptage des annonces')
  const { count, error: countError } = await supabase
    .from('announcements')
    .select('*', { count: 'exact', head: true })

  if (countError) {
    console.error('❌ Erreur:', countError)
  } else {
    console.log(`✅ Nombre total d'annonces: ${count}`)
  }

  console.log('\n✅ Diagnostic terminé')
}

diagnose().catch(console.error)
