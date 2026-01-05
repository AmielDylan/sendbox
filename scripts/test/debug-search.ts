/**
 * Script de diagnostic pour la recherche d'annonces
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Charger les variables d'environnement
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

console.log('URL:', supabaseUrl ? 'OK' : 'MANQUANT')
console.log('KEY:', supabaseKey ? 'OK' : 'MANQUANT')

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugSearch() {
  console.log('\n=== DEBUG RECHERCHE ANNONCES ===\n')

  // 1. Vérifier toutes les annonces en base (APRÈS MIGRATION 046)
  console.log('1. Toutes les annonces en base (lecture publique):')
  const { data: allAnnouncements, error: allError } = await supabase
    .from('announcements')
    .select('id, departure_country, arrival_country, departure_date, available_kg, status')
    .in('status', ['active', 'published', 'partially_booked'])
    .limit(10)

  if (allError) {
    console.error('Erreur:', allError)
  } else {
    console.log(`Nombre total: ${allAnnouncements?.length || 0}`)
    allAnnouncements?.forEach((a: any) => {
      console.log(`  - ${a.departure_country} → ${a.arrival_country}, ${a.departure_date}, ${a.available_kg}kg, status: ${a.status}`)
    })
  }

  // 2. Vérifier les annonces FR -> BJ
  console.log('\n2. Annonces FR → BJ:')
  const { data: frBjAnnouncements, error: frBjError } = await supabase
    .from('announcements')
    .select('*')
    .eq('departure_country', 'FR')
    .eq('arrival_country', 'BJ')

  if (frBjError) {
    console.error('Erreur:', frBjError)
  } else {
    console.log(`Nombre trouvé: ${frBjAnnouncements?.length || 0}`)
    frBjAnnouncements?.forEach((a: any) => {
      console.log(`  - ID: ${a.id}`)
      console.log(`    Date départ: ${a.departure_date}`)
      console.log(`    Poids dispo: ${a.available_kg}kg`)
      console.log(`    Status: ${a.status}`)
      console.log(`    Créé le: ${a.created_at}`)
    })
  }

  // 3. Tester la fonction search_announcements
  console.log('\n3. Test de la fonction search_announcements:')
  const searchParams = {
    p_departure_country: 'FR',
    p_arrival_country: 'BJ',
    p_departure_date: '2026-01-02',
    p_min_kg: 1,
    p_sort_by: 'date',
    p_limit: 10,
    p_offset: 0,
  }
  console.log('Paramètres:', searchParams)

  const { data: searchResults, error: searchError } = await supabase.rpc(
    'search_announcements',
    searchParams
  )

  if (searchError) {
    console.error('Erreur RPC:', searchError)
  } else {
    console.log(`Résultats trouvés: ${searchResults?.length || 0}`)
    searchResults?.forEach((r: any) => {
      console.log(`  - ${r.departure_country} → ${r.arrival_country}`)
      console.log(`    Date: ${r.departure_date}`)
      console.log(`    Poids: ${r.available_kg}kg`)
      console.log(`    Status: ${r.status}`)
      console.log(`    Match score: ${r.match_score}`)
    })
  }

  // 4. Tester sans filtre de date
  console.log('\n4. Test sans filtre de date:')
  const { data: noDateResults, error: noDateError } = await supabase.rpc(
    'search_announcements',
    {
      p_departure_country: 'FR',
      p_arrival_country: 'BJ',
      p_departure_date: null,
      p_min_kg: 1,
      p_sort_by: 'date',
      p_limit: 10,
      p_offset: 0,
    }
  )

  if (noDateError) {
    console.error('Erreur RPC:', noDateError)
  } else {
    console.log(`Résultats trouvés: ${noDateResults?.length || 0}`)
    noDateResults?.forEach((r: any) => {
      console.log(`  - ${r.departure_country} → ${r.arrival_country}, ${r.departure_date}, ${r.status}`)
    })
  }

  console.log('\n=== FIN DEBUG ===\n')
}

debugSearch().catch(console.error)
