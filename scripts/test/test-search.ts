/**
 * Script de test pour la fonction search_announcements
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Charger les variables d'environnement depuis .env.local
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables!')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅' : '❌')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testSearch() {
  console.log('Testing search_announcements RPC...\n')

  // Tester l'annonce spécifique qui cause la 404
  const targetId = 'd9af05ed-ca64-4004-899c-00ffc33f1018'
  console.log('Checking announcement:', targetId)

  // Test 1: Recherche sans filtres (toutes les annonces actives)
  console.log('Test 1: Recherche sans filtres')
  const { data: test1, error: error1 } = await supabase.rpc('search_announcements', {
    p_departure_country: null,
    p_arrival_country: null,
    p_departure_date: null,
    p_min_kg: null,
    p_sort_by: 'date',
    p_limit: 10,
    p_offset: 0,
  })

  if (error1) {
    console.error('❌ Error:', error1)
  } else {
    console.log(`✅ Found ${test1?.length || 0} announcements`)
    const target = test1?.find((a: any) => a.id === targetId)
    if (target) {
      console.log('✅ Target announcement FOUND in results')
      console.log('Status:', target.status)
      console.log('Data:', target)
    } else {
      console.log('❌ Target announcement NOT in results')
    }
    if (test1 && test1.length > 0) {
      console.log('\nFirst result:', test1[0])
    }
  }

  // Test 2: Recherche France -> Bénin
  console.log('\nTest 2: Recherche France -> Bénin')
  const { data: test2, error: error2 } = await supabase.rpc('search_announcements', {
    p_departure_country: 'FR',
    p_arrival_country: 'BJ',
    p_departure_date: null,
    p_min_kg: null,
    p_sort_by: 'date',
    p_limit: 10,
    p_offset: 0,
  })

  if (error2) {
    console.error('❌ Error:', error2)
  } else {
    console.log(`✅ Found ${test2?.length || 0} announcements`)
    if (test2 && test2.length > 0) {
      console.log('First result:', {
        id: test2[0].id,
        departure: `${test2[0].departure_city}, ${test2[0].departure_country}`,
        arrival: `${test2[0].arrival_city}, ${test2[0].arrival_country}`,
        departure_date: test2[0].departure_date,
        status: test2[0].status,
      })
    }
  }

  // Test 3: Compter toutes les annonces
  console.log('\nTest 3: Count all announcements')
  const { data: count, error: error3 } = await supabase.rpc('count_search_announcements', {
    p_departure_country: null,
    p_arrival_country: null,
    p_departure_date: null,
    p_min_kg: null,
  })

  if (error3) {
    console.error('❌ Error:', error3)
  } else {
    console.log(`✅ Total count: ${count}`)
  }

  // Test 4: Lister toutes les annonces depuis la table directement
  console.log('\nTest 4: Direct query from announcements table')
  const { data: direct, error: error4 } = await supabase
    .from('announcements')
    .select('id, departure_country, arrival_country, departure_city, arrival_city, status, departure_date')
    .in('status', ['active', 'published', 'partially_booked'])
    .order('created_at', { ascending: false })
    .limit(5)

  if (error4) {
    console.error('❌ Error:', error4)
  } else {
    console.log(`✅ Found ${direct?.length || 0} announcements (direct query)`)
    if (direct && direct.length > 0) {
      direct.forEach((ann, i) => {
        console.log(`  ${i + 1}. ${ann.departure_city} (${ann.departure_country}) -> ${ann.arrival_city} (${ann.arrival_country})`)
        console.log(`     Status: ${ann.status}, Date: ${ann.departure_date}`)
      })
    }
  }
}

testSearch()
  .then(() => {
    console.log('\n✅ Tests completed')
    process.exit(0)
  })
  .catch((err) => {
    console.error('\n❌ Test failed:', err)
    process.exit(1)
  })
