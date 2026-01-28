/**
 * Script de test pour les fonctions RPC Supabase
 *
 * Usage:
 *   npx tsx scripts/test-rpc.ts
 *
 * Ou avec ts-node:
 *   ts-node scripts/test-rpc.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

// Charger les variables d'environnement depuis .env.local
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
    console.warn(
      "Impossible de charger .env.local, utilisation des variables d'environnement système"
    )
  }
}

loadEnvFile()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Variables d'environnement manquantes")
  console.error(
    'Assurez-vous que NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont définies dans .env.local'
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface TestResult {
  name: string
  success: boolean
  error?: string
  data?: any
}

const results: TestResult[] = []

async function testFunction(
  name: string,
  functionName: string,
  params: Record<string, any>
): Promise<void> {
  console.log(`\n🧪 Test: ${name}`)
  console.log(`   Fonction: ${functionName}`)
  console.log(`   Paramètres:`, JSON.stringify(params, null, 2))

  try {
    const { data, error } = await supabase.rpc(functionName, params)

    if (error) {
      console.error(`   ❌ Erreur:`, error.message)
      results.push({
        name,
        success: false,
        error: error.message,
      })
    } else {
      console.log(`   ✅ Succès`)
      if (data !== null && data !== undefined) {
        console.log(
          `   Résultat:`,
          Array.isArray(data) ? `${data.length} éléments` : data
        )
      }
      results.push({
        name,
        success: true,
        data,
      })
    }
  } catch (error: any) {
    console.error(`   ❌ Exception:`, error.message)
    results.push({
      name,
      success: false,
      error: error.message,
    })
  }
}

async function runTests() {
  console.log('🚀 Démarrage des tests RPC...\n')
  console.log('='.repeat(60))

  // Test 1: search_announcements (sans filtres)
  await testFunction(
    "Recherche d'annonces (sans filtres)",
    'search_announcements',
    {
      p_limit: 5,
      p_offset: 0,
    }
  )

  // Test 2: search_announcements (avec filtres)
  await testFunction("Recherche d'annonces (FR → BJ)", 'search_announcements', {
    p_departure_country: 'FR',
    p_arrival_country: 'BJ',
    p_limit: 5,
    p_offset: 0,
  })

  // Test 3: count_search_announcements
  await testFunction("Compte d'annonces", 'count_search_announcements', {
    p_departure_country: 'FR',
    p_arrival_country: 'BJ',
  })

  // Test 4: increment_announcement_views
  // Note: Nécessite un ID d'annonce valide
  // await testFunction(
  //   'Incrémenter vues annonce',
  //   'increment_announcement_views',
  //   {
  //     p_announcement_id: 'announcement-uuid-here',
  //   }
  // )

  // Test 5: count_unread_notifications
  // Note: Nécessite un ID d'utilisateur valide
  // await testFunction(
  //   'Compter notifications non lues',
  //   'count_unread_notifications',
  //   {
  //     p_user_id: 'user-uuid-here',
  //   }
  // )

  // Test 6: get_user_conversations
  // Note: Nécessite un ID d'utilisateur valide
  // await testFunction(
  //   'Récupérer conversations',
  //   'get_user_conversations',
  //   {
  //     p_user_id: 'user-uuid-here',
  //   }
  // )

  // Résumé
  console.log('\n' + '='.repeat(60))
  console.log('\n📊 Résumé des tests:\n')

  const successCount = results.filter(r => r.success).length
  const failureCount = results.filter(r => !r.success).length

  results.forEach(result => {
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
    console.log('\n⚠️  Certains tests ont échoué. Vérifiez:')
    console.log('   - Que les migrations sont appliquées')
    console.log('   - Que les fonctions existent dans la base de données')
    console.log('   - Que les paramètres sont corrects')
    process.exit(1)
  } else {
    console.log('\n🎉 Tous les tests sont passés!')
    process.exit(0)
  }
}

// Exécuter les tests
runTests().catch(error => {
  console.error('\n❌ Erreur fatale:', error)
  process.exit(1)
})
