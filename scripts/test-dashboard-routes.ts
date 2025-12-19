#!/usr/bin/env node
/**
 * Script de test des routes dashboard après authentification
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Charger .env.local explicitement
config({ path: resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const TEST_EMAIL = 'amieladjovi@yahoo.fr'
const TEST_PASSWORD = 'Amieldylan2025@'

interface TestResult {
  name: string
  success: boolean
  details?: string
  error?: string
}

const results: TestResult[] = []

function logResult(result: TestResult) {
  const icon = result.success ? '✅' : '❌'
  console.log(`${icon} ${result.name}`)
  if (result.details) {
    console.log(`   ${result.details}`)
  }
  if (result.error) {
    console.log(`   Erreur: ${result.error}`)
  }
  results.push(result)
}

async function testDashboardRoutes() {
  console.log('🚀 Test des routes dashboard après authentification...\n')

  // 1. Se connecter
  console.log('🔐 Authentification...')
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  })

  if (authError || !authData.session) {
    logResult({
      name: 'Authentification',
      success: false,
      error: authError?.message || 'Pas de session',
    })
    return
  }

  logResult({
    name: 'Authentification',
    success: true,
    details: `Connecté en tant que ${TEST_EMAIL}`,
  })

  const accessToken = authData.session.access_token

  console.log('\n📄 Test des routes dashboard...')

  const routes = [
    '/dashboard',
    '/dashboard/messages',
    '/dashboard/annonces',
    '/dashboard/colis',
    '/dashboard/notifications',
    '/dashboard/reglages',
    '/dashboard/reglages/compte',
    '/dashboard/reglages/profil',
    '/dashboard/reglages/kyc',
  ]

  for (const route of routes) {
    try {
      const response = await fetch(`${BASE_URL}${route}`, {
        headers: {
          Cookie: `sb-access-token=${accessToken}; sb-refresh-token=${authData.session.refresh_token}`,
        },
        redirect: 'manual', // Ne pas suivre les redirections
      })

      const success = response.status === 200 || response.status === 307
      logResult({
        name: `${route}`,
        success,
        details: `Status: ${response.status}`,
      })
    } catch (error) {
      logResult({
        name: `${route}`,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  // Résumé
  console.log('\n' + '='.repeat(80))
  console.log('📊 RÉCAPITULATIF DES TESTS')
  console.log('='.repeat(80) + '\n')

  const successes = results.filter((r) => r.success).length
  const failures = results.filter((r) => !r.success).length

  console.log(`✅ Succès: ${successes}`)
  console.log(`❌ Erreurs: ${failures}`)
  console.log(`📊 Total: ${results.length}`)
  console.log('\n' + '='.repeat(80) + '\n')

  process.exit(failures > 0 ? 1 : 0)
}

testDashboardRoutes().catch((error) => {
  console.error('❌ Erreur fatale:', error)
  process.exit(1)
})

