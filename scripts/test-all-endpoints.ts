/**
 * Script de test complet pour tous les endpoints de l'application
 * Teste les API routes, Server Actions et pages
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Charger les variables d'environnement depuis .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

const TEST_EMAIL = 'amieladjovi@yahoo.fr'
const TEST_PASSWORD = 'Amieldylan2025@'

interface TestResult {
  name: string
  status: 'success' | 'error' | 'skipped'
  message: string
  details?: any
}

const results: TestResult[] = []

function logResult(result: TestResult) {
  results.push(result)
  const icon = result.status === 'success' ? '✅' : result.status === 'error' ? '❌' : '⏭️'
  console.log(`${icon} ${result.name}: ${result.message}`)
  if (result.details) {
    console.log('   Détails:', JSON.stringify(result.details, null, 2))
  }
}

async function testSupabaseConnection() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    const { data, error } = await supabase.from('profiles').select('count').limit(1)
    
    if (error) {
      logResult({
        name: 'Connexion Supabase',
        status: 'error',
        message: `Erreur de connexion: ${error.message}`,
        details: error
      })
      return null
    }
    
    logResult({
      name: 'Connexion Supabase',
      status: 'success',
      message: 'Connexion réussie'
    })
    return supabase
  } catch (error: any) {
    logResult({
      name: 'Connexion Supabase',
      status: 'error',
      message: `Erreur: ${error.message}`,
      details: error
    })
    return null
  }
}

async function testAuth(supabase: any) {
  console.log('\n🔐 Tests d\'authentification...')
  
  // Test de connexion
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    })
    
    if (error) {
      logResult({
        name: 'Connexion utilisateur',
        status: 'error',
        message: `Erreur: ${error.message}`,
        details: error
      })
      return null
    }
    
    logResult({
      name: 'Connexion utilisateur',
      status: 'success',
      message: `Connecté en tant que ${data.user?.email}`,
      details: { userId: data.user?.id }
    })
    
    return { supabase, user: data.user, session: data.session }
  } catch (error: any) {
    logResult({
      name: 'Connexion utilisateur',
      status: 'error',
      message: `Erreur: ${error.message}`,
      details: error
    })
    return null
  }
}

async function testPages() {
  console.log('\n📄 Tests des pages...')
  
  const pages = [
    { path: '/', name: 'Page d\'accueil', public: true },
    { path: '/login', name: 'Page de connexion', public: true },
    { path: '/register', name: 'Page d\'inscription', public: true },
    { path: '/recherche', name: 'Page de recherche', public: true },
    { path: '/dashboard', name: 'Dashboard', public: false },
    { path: '/dashboard/annonces', name: 'Mes annonces', public: false },
    { path: '/dashboard/colis', name: 'Mes colis', public: false },
    { path: '/dashboard/messages', name: 'Messages', public: false },
    { path: '/dashboard/reglages/compte', name: 'Paramètres compte', public: false },
  ]
  
  for (const page of pages) {
    try {
      const response = await fetch(`${BASE_URL}${page.path}`, {
        method: 'GET',
        redirect: 'manual',
      })
      
      if (response.status === 200 || response.status === 307 || response.status === 308) {
        logResult({
          name: page.name,
          status: 'success',
          message: `Page accessible (${response.status})`,
        })
      } else if (response.status === 401 || response.status === 403) {
        logResult({
          name: page.name,
          status: page.public ? 'error' : 'success',
          message: page.public 
            ? `Page protégée alors qu'elle devrait être publique (${response.status})`
            : `Page protégée correctement (${response.status})`,
        })
      } else {
        logResult({
          name: page.name,
          status: 'error',
          message: `Status inattendu: ${response.status}`,
        })
      }
    } catch (error: any) {
      logResult({
        name: page.name,
        status: 'error',
        message: `Erreur: ${error.message}`,
      })
    }
  }
}

async function testAPIEndpoints() {
  console.log('\n🔌 Tests des API Routes...')
  
  // Test POST /api/payments/create-intent (nécessite authentification)
  try {
    const response = await fetch(`${BASE_URL}/api/payments/create-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        booking_id: 'test-booking-id',
        amount: 10000, // 100€ en centimes
      }),
    })
    
    const data = await response.json()
    
    if (response.status === 401 || response.status === 403) {
      logResult({
        name: 'POST /api/payments/create-intent',
        status: 'success',
        message: 'Protection d\'authentification active',
      })
    } else if (response.status === 400) {
      logResult({
        name: 'POST /api/payments/create-intent',
        status: 'success',
        message: 'Validation des données active',
        details: data
      })
    } else {
      logResult({
        name: 'POST /api/payments/create-intent',
        status: response.ok ? 'success' : 'error',
        message: `Status: ${response.status}`,
        details: data
      })
    }
  } catch (error: any) {
    logResult({
      name: 'POST /api/payments/create-intent',
      status: 'error',
      message: `Erreur: ${error.message}`,
    })
  }
  
  // Test POST /api/webhooks/stripe (nécessite signature Stripe)
  try {
    const response = await fetch(`${BASE_URL}/api/webhooks/stripe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test-signature',
      },
      body: JSON.stringify({
        type: 'payment_intent.succeeded',
        data: { object: { id: 'test' } },
      }),
    })
    
    if (response.status === 400 || response.status === 401) {
      logResult({
        name: 'POST /api/webhooks/stripe',
        status: 'success',
        message: 'Validation de signature active',
      })
    } else {
      logResult({
        name: 'POST /api/webhooks/stripe',
        status: response.ok ? 'success' : 'error',
        message: `Status: ${response.status}`,
      })
    }
  } catch (error: any) {
    logResult({
      name: 'POST /api/webhooks/stripe',
      status: 'error',
      message: `Erreur: ${error.message}`,
    })
  }
}

async function testServerActions(authData: any) {
  console.log('\n⚙️ Tests des Server Actions...')
  
  if (!authData) {
    logResult({
      name: 'Server Actions',
      status: 'skipped',
      message: 'Authentification requise - tests ignorés',
    })
    return
  }
  
  const { supabase, user } = authData
  
  // Test: Récupération du profil
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (error) {
      logResult({
        name: 'getProfile',
        status: 'error',
        message: `Erreur: ${error.message}`,
        details: error
      })
    } else {
      logResult({
        name: 'getProfile',
        status: 'success',
        message: `Profil récupéré: ${profile?.firstname || 'N/A'} ${profile?.lastname || 'N/A'}`,
        details: { kyc_status: profile?.kyc_status, role: profile?.role }
      })
    }
  } catch (error: any) {
    logResult({
      name: 'getProfile',
      status: 'error',
      message: `Erreur: ${error.message}`,
    })
  }
  
  // Test: Récupération des annonces actives
  try {
    const { data: announcements, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('traveler_id', user.id)
      .limit(5)
    
    if (error) {
      logResult({
        name: 'getAnnouncements',
        status: 'error',
        message: `Erreur: ${error.message}`,
        details: error
      })
    } else {
      logResult({
        name: 'getAnnouncements',
        status: 'success',
        message: `${announcements?.length || 0} annonce(s) trouvée(s)`,
      })
    }
  } catch (error: any) {
    logResult({
      name: 'getAnnouncements',
      status: 'error',
      message: `Erreur: ${error.message}`,
    })
  }
  
  // Test: Récupération des réservations
  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .or(`sender_id.eq.${user.id},traveler_id.eq.${user.id}`)
      .limit(5)
    
    if (error) {
      logResult({
        name: 'getBookings',
        status: 'error',
        message: `Erreur: ${error.message}`,
        details: error
      })
    } else {
      logResult({
        name: 'getBookings',
        status: 'success',
        message: `${bookings?.length || 0} réservation(s) trouvée(s)`,
      })
    }
  } catch (error: any) {
    logResult({
      name: 'getBookings',
      status: 'error',
      message: `Erreur: ${error.message}`,
    })
  }
  
  // Test: Récupération des notifications
  try {
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (error) {
      logResult({
        name: 'getNotifications',
        status: 'error',
        message: `Erreur: ${error.message}`,
        details: error
      })
    } else {
      logResult({
        name: 'getNotifications',
        status: 'success',
        message: `${notifications?.length || 0} notification(s) trouvée(s)`,
      })
    }
  } catch (error: any) {
    logResult({
      name: 'getNotifications',
      status: 'error',
      message: `Erreur: ${error.message}`,
    })
  }
  
  // Test: Récupération des conversations (via RPC)
  try {
    const { data: conversations, error } = await supabase.rpc('get_user_conversations', {
      p_user_id: user.id
    })
    
    if (error) {
      logResult({
        name: 'getConversations',
        status: 'error',
        message: `Erreur: ${error.message}`,
        details: error
      })
    } else {
      logResult({
        name: 'getConversations',
        status: 'success',
        message: `${conversations?.length || 0} conversation(s) trouvée(s)`,
      })
    }
  } catch (error: any) {
    logResult({
      name: 'getConversations',
      status: 'error',
      message: `Erreur: ${error.message}`,
    })
  }
}

async function testRPCFunctions(authData: any) {
  console.log('\n🔧 Tests des fonctions RPC...')
  
  if (!authData) {
    logResult({
      name: 'RPC Functions',
      status: 'skipped',
      message: 'Authentification requise - tests ignorés',
    })
    return
  }
  
  const { supabase, user } = authData
  
  // Test: count_unread_notifications
  try {
    const { data, error } = await supabase.rpc('count_unread_notifications', {
      p_user_id: user.id
    })
    
    if (error) {
      logResult({
        name: 'RPC: count_unread_notifications',
        status: 'error',
        message: `Erreur: ${error.message}`,
        details: error
      })
    } else {
      logResult({
        name: 'RPC: count_unread_notifications',
        status: 'success',
        message: `${data || 0} notification(s) non lue(s)`,
      })
    }
  } catch (error: any) {
    logResult({
      name: 'RPC: count_unread_notifications',
      status: 'error',
      message: `Erreur: ${error.message}`,
    })
  }
  
  // Test: search_announcements
  try {
    const { data, error } = await supabase.rpc('search_announcements', {
      p_departure_country: 'FR',
      p_arrival_country: 'BJ',
      p_departure_date: new Date().toISOString().split('T')[0], // Format DATE
      p_min_kg: 1,
      p_sort_by: 'date',
      p_limit: 10,
      p_offset: 0
    })
    
    if (error) {
      logResult({
        name: 'RPC: search_announcements',
        status: 'error',
        message: `Erreur: ${error.message}`,
        details: error
      })
    } else {
      logResult({
        name: 'RPC: search_announcements',
        status: 'success',
        message: `${data?.length || 0} annonce(s) trouvée(s)`,
      })
    }
  } catch (error: any) {
    logResult({
      name: 'RPC: search_announcements',
      status: 'error',
      message: `Erreur: ${error.message}`,
    })
  }
  
  // Test: get_user_conversations
  try {
    const { data, error } = await supabase.rpc('get_user_conversations', {
      p_user_id: user.id
    })
    
    if (error) {
      logResult({
        name: 'RPC: get_user_conversations',
        status: 'error',
        message: `Erreur: ${error.message}`,
        details: error
      })
    } else {
      logResult({
        name: 'RPC: get_user_conversations',
        status: 'success',
        message: `${data?.length || 0} conversation(s) trouvée(s)`,
      })
    }
  } catch (error: any) {
    logResult({
      name: 'RPC: get_user_conversations',
      status: 'error',
      message: `Erreur: ${error.message}`,
    })
  }
}

function generateReport() {
  console.log('\n' + '='.repeat(80))
  console.log('📊 RÉCAPITULATIF DES TESTS')
  console.log('='.repeat(80))
  
  const success = results.filter(r => r.status === 'success').length
  const errors = results.filter(r => r.status === 'error').length
  const skipped = results.filter(r => r.status === 'skipped').length
  
  console.log(`\n✅ Succès: ${success}`)
  console.log(`❌ Erreurs: ${errors}`)
  console.log(`⏭️  Ignorés: ${skipped}`)
  console.log(`📊 Total: ${results.length}`)
  
  if (errors > 0) {
    console.log('\n❌ ERREURS DÉTECTÉES:')
    results
      .filter(r => r.status === 'error')
      .forEach(r => {
        console.log(`\n  • ${r.name}`)
        console.log(`    Message: ${r.message}`)
        if (r.details) {
          console.log(`    Détails: ${JSON.stringify(r.details, null, 2)}`)
        }
      })
  }
  
  console.log('\n' + '='.repeat(80))
}

async function main() {
  console.log('🚀 Démarrage des tests des endpoints...\n')
  console.log(`Base URL: ${BASE_URL}`)
  console.log(`Email de test: ${TEST_EMAIL}\n`)
  
  // Test 1: Connexion Supabase
  const supabase = await testSupabaseConnection()
  if (!supabase) {
    console.log('\n❌ Impossible de continuer sans connexion Supabase')
    generateReport()
    process.exit(1)
  }
  
  // Test 2: Authentification
  const authData = await testAuth(supabase)
  
  // Test 3: Pages
  await testPages()
  
  // Test 4: API Routes
  await testAPIEndpoints()
  
  // Test 5: Server Actions
  await testServerActions(authData)
  
  // Test 6: RPC Functions
  await testRPCFunctions(authData)
  
  // Génération du rapport
  generateReport()
}

main().catch(console.error)

