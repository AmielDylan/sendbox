/**
 * Test direct des fonctions RPC avec diagnostic
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

function loadEnvFile() {
  try {
    const envFile = readFileSync(join(process.cwd(), '.env.local'), 'utf-8')
    envFile.split('\n').forEach(line => {
      const match = line.match(/^([^=:#]+)=(.*)$/)
      if (match) {
        const key = match[1].trim()
        const value = match[2].trim().replace(/^["']|["']$/g, '')
        if (!process.env[key]) {
          process.env[key] = value
        }
      }
    })
  } catch {}
}

loadEnvFile()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function test() {
  console.log('🔍 Diagnostic des fonctions RPC\n')

  // Test 1: Vérifier si on peut lire announcements
  console.log('1️⃣ Test lecture table announcements:')
  const { data: annData, error: annError } = await supabase
    .from('announcements')
    .select('*')
    .limit(1)

  if (annError) {
    console.log(`   ❌ Erreur: ${annError.message}`)
  } else {
    console.log(`   ✅ Table accessible`)
    if (annData && annData.length > 0) {
      console.log(`   📋 Colonnes: ${Object.keys(annData[0]).join(', ')}`)
    } else {
      console.log(`   ⚠️  Table vide`)
    }
  }

  // Test 2: Fonction qui fonctionne (count_unread_notifications)
  console.log('\n2️⃣ Test fonction count_unread_notifications:')
  const { data: countData, error: countError } = await supabase.rpc(
    'count_unread_notifications',
    { p_user_id: '00000000-0000-0000-0000-000000000000' }
  )
  if (countError) {
    console.log(`   ❌ Erreur: ${countError.message}`)
  } else {
    console.log(`   ✅ Fonction fonctionne, résultat: ${countData}`)
  }

  // Test 3: Fonction search_announcements avec diagnostic
  console.log('\n3️⃣ Test fonction search_announcements:')
  const { data: searchData, error: searchError } = await supabase.rpc(
    'search_announcements',
    { p_limit: 1, p_offset: 0 }
  )
  if (searchError) {
    console.log(`   ❌ Erreur: ${searchError.message}`)
    console.log(`   📝 Code: ${searchError.code}`)
    console.log(
      `   💡 Suggestion: Vérifiez que la colonne traveler_id existe dans announcements`
    )
  } else {
    console.log(`   ✅ Fonction fonctionne`)
    console.log(`   📊 Résultats: ${searchData?.length || 0} annonces`)
  }

  // Test 4: Vérifier le statut des annonces existantes
  console.log('\n4️⃣ Vérification statuts des annonces:')
  const { data: statusData, error: statusError } = await supabase
    .from('announcements')
    .select('status')
    .limit(5)
  if (statusError) {
    console.log(`   ❌ Erreur: ${statusError.message}`)
  } else {
    const statuses = [...new Set(statusData?.map((a: any) => a.status) || [])]
    console.log(`   ✅ Statuts trouvés: ${statuses.join(', ') || 'aucun'}`)
  }
}

test().catch(console.error)
