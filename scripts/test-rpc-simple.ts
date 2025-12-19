/**
 * Script de test simplifié pour les fonctions RPC Supabase
 * Teste uniquement les fonctions qui ne dépendent pas de tables spécifiques
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

// Charger les variables d'environnement depuis .env.local
function loadEnvFile() {
  try {
    const envFile = readFileSync(join(process.cwd(), '.env.local'), 'utf-8')
    envFile.split('\n').forEach((line) => {
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testFunction(name: string, functionName: string, params: Record<string, any>) {
  console.log(`\n🧪 Test: ${name}`)
  console.log(`   Fonction: ${functionName}`)
  console.log(`   Paramètres:`, JSON.stringify(params, null, 2))

  try {
    const { data, error } = await supabase.rpc(functionName, params)

    if (error) {
      console.error(`   ❌ Erreur:`, error.message)
      return { success: false, error: error.message }
    } else {
      console.log(`   ✅ Succès`)
      if (data !== null && data !== undefined) {
        if (Array.isArray(data)) {
          console.log(`   Résultat: ${data.length} éléments`)
        } else {
          console.log(`   Résultat:`, typeof data === 'object' ? JSON.stringify(data, null, 2) : data)
        }
      }
      return { success: true, data }
    }
  } catch (error: any) {
    console.error(`   ❌ Exception:`, error.message)
    return { success: false, error: error.message }
  }
}

async function checkTableExists(tableName: string) {
  try {
    const { data, error } = await supabase.from(tableName).select('*').limit(1)
    if (error && error.code === '42P01') {
      return false // Table does not exist
    }
    return true
  } catch {
    return false
  }
}

async function runTests() {
  console.log('🚀 Démarrage des tests RPC...\n')
  console.log('='.repeat(60))

  // Vérifier l'existence des tables
  console.log('\n📋 Vérification des tables...')
  const tables = ['announcements', 'profiles', 'bookings', 'notifications', 'ratings']
  for (const table of tables) {
    const exists = await checkTableExists(table)
    console.log(`   ${exists ? '✅' : '❌'} Table '${table}': ${exists ? 'existe' : 'n\'existe pas'}`)
  }

  const results: Array<{ name: string; success: boolean; error?: string }> = []

  // Test 1: count_unread_notifications (nécessite notifications et profiles)
  console.log('\n' + '='.repeat(60))
  const notificationsExists = await checkTableExists('notifications')
  const profilesExists = await checkTableExists('profiles')
  
  if (notificationsExists && profilesExists) {
    // Utiliser un UUID de test (vous pouvez le remplacer par un UUID réel)
    const testUserId = '00000000-0000-0000-0000-000000000000'
    const result1 = await testFunction(
      'Compter notifications non lues',
      'count_unread_notifications',
      { p_user_id: testUserId }
    )
    results.push({ name: 'count_unread_notifications', ...result1 })
  } else {
    console.log('\n⚠️  Tables notifications/profiles manquantes, test ignoré')
  }

  // Test 2: search_announcements (nécessite announcements)
  console.log('\n' + '='.repeat(60))
  const announcementsExists = await checkTableExists('announcements')
  
  if (announcementsExists) {
    const result2 = await testFunction(
      'Recherche d\'annonces (sans filtres)',
      'search_announcements',
      { p_limit: 5, p_offset: 0 }
    )
    results.push({ name: 'search_announcements', ...result2 })

    const result3 = await testFunction(
      'Recherche d\'annonces (FR → BJ)',
      'search_announcements',
      {
        p_departure_country: 'FR',
        p_arrival_country: 'BJ',
        p_limit: 5,
        p_offset: 0,
      }
    )
    results.push({ name: 'search_announcements (filtres)', ...result3 })

    const result4 = await testFunction(
      'Compte d\'annonces',
      'count_search_announcements',
      {
        p_departure_country: 'FR',
        p_arrival_country: 'BJ',
      }
    )
    results.push({ name: 'count_search_announcements', ...result4 })
  } else {
    console.log('\n⚠️  Table announcements manquante, tests ignorés')
    console.log('   💡 La table announcements doit être créée dans la migration 001_initial_schema.sql')
  }

  // Résumé
  console.log('\n' + '='.repeat(60))
  console.log('\n📊 Résumé des tests:\n')

  const successCount = results.filter((r) => r.success).length
  const failureCount = results.filter((r) => !r.success).length

  results.forEach((result) => {
    const icon = result.success ? '✅' : '❌'
    console.log(`${icon} ${result.name}`)
    if (!result.success && result.error) {
      console.log(`   Erreur: ${result.error}`)
    }
  })

  console.log(`\n📈 Total: ${results.length} tests`)
  console.log(`   ✅ Réussis: ${successCount}`)
  console.log(`   ❌ Échoués: ${failureCount}`)

  if (failureCount > 0) {
    console.log('\n💡 Suggestions:')
    console.log('   1. Vérifiez que toutes les migrations sont appliquées')
    console.log('   2. Vérifiez que les tables existent dans la base de données')
    console.log('   3. Vérifiez que les fonctions RPC sont créées')
    console.log('   4. Exécutez: supabase db push --linked')
  } else if (results.length === 0) {
    console.log('\n⚠️  Aucun test exécuté car les tables nécessaires n\'existent pas')
    console.log('   💡 Créez d\'abord le schéma initial dans 001_initial_schema.sql')
  } else {
    console.log('\n🎉 Tous les tests sont passés!')
  }
}

runTests().catch((error) => {
  console.error('\n❌ Erreur fatale:', error)
  process.exit(1)
})





