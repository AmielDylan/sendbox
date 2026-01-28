/**
 * Script pour vérifier le schéma de la base de données
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
  } catch (error) {
    console.warn('Impossible de charger .env.local')
  }
}

loadEnvFile()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function checkSchema() {
  console.log('🔍 Vérification du schéma de la base de données...\n')

  // Tester announcements
  console.log('📋 Table announcements:')
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .limit(1)
    if (error) {
      console.log(`   ❌ Erreur: ${error.message}`)
      if (error.message.includes('traveler_id')) {
        console.log("   💡 La colonne traveler_id n'existe peut-être pas")
      }
    } else {
      console.log('   ✅ Table accessible')
      if (data && data.length > 0) {
        console.log('   Colonnes trouvées:', Object.keys(data[0]).join(', '))
      } else {
        console.log('   ⚠️  Table vide, impossible de détecter les colonnes')
      }
    }
  } catch (e: any) {
    console.log(`   ❌ Exception: ${e.message}`)
  }

  // Tester profiles
  console.log('\n📋 Table profiles:')
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, user_id')
      .limit(1)
    if (error) {
      console.log(`   ❌ Erreur: ${error.message}`)
    } else {
      console.log('   ✅ Table accessible')
      if (data && data.length > 0) {
        console.log('   Colonnes testées:', Object.keys(data[0]).join(', '))
      }
    }
  } catch (e: any) {
    console.log(`   ❌ Exception: ${e.message}`)
  }

  // Tester directement la fonction RPC avec une requête SQL brute
  console.log('\n🧪 Test direct de la fonction search_announcements:')
  try {
    // Essayer avec différents noms de colonnes possibles
    const testQueries = [
      {
        name: 'traveler_id',
        query: 'SELECT traveler_id FROM announcements LIMIT 1',
      },
      { name: 'user_id', query: 'SELECT user_id FROM announcements LIMIT 1' },
    ]

    for (const test of testQueries) {
      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          query: test.query,
        })
        if (!error) {
          console.log(`   ✅ Colonne '${test.name}' existe`)
        }
      } catch {
        // Ignorer les erreurs
      }
    }
  } catch (e: any) {
    console.log(`   ⚠️  Impossible de tester directement`)
  }
}

checkSchema().catch(console.error)
