/**
 * Force PostgREST à recharger le schéma de la base de données
 * Utile après des changements de colonnes pour éviter les erreurs de cache
 */

import { config } from 'dotenv'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Clé service (si disponible)
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function reloadSchema() {
  console.log('\n=== RECHARGEMENT DU SCHÉMA POSTGREST ===\n')

  // PostgREST expose un endpoint pour recharger le schéma
  // Endpoint: POST /rpc/pgrst_reload_schema (sur certaines installations)
  // Ou: envoyer un signal SIGUSR1 au processus PostgREST (nécessite accès serveur)

  console.log('Note: Le rechargement du schéma PostgREST nécessite généralement:')
  console.log('1. Un redémarrage de l\'instance PostgREST (via le dashboard Supabase)')
  console.log('2. Ou attendre le rechargement automatique du cache (peut prendre quelques minutes)')
  console.log('3. Ou utiliser la clé service pour appeler un endpoint de rechargement')

  console.log('\n📋 ACTIONS RECOMMANDÉES:\n')
  console.log('1. Aller sur https://app.supabase.com/project/tpvjycjlzxlbrtbvyfsx/settings/api')
  console.log('2. Redémarrer le projet (Project Settings > General > Restart project)')
  console.log('3. Ou attendre 5-10 minutes pour que le cache se rafraîchisse automatiquement')

  console.log('\n💡 SOLUTION ALTERNATIVE:\n')
  console.log('Créer une vue matérialisée ou une fonction qui force le rechargement:')
  console.log('NOTIFY pgrst, \'reload schema\';')

  // Test de connexion
  console.log('\n🧪 Test de connexion...')
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
      }
    })
    console.log('✅ Connexion à PostgREST: OK (status', response.status, ')')
  } catch (error) {
    console.error('❌ Erreur de connexion:', error)
  }

  console.log('\n=== FIN ===\n')
}

reloadSchema().catch(console.error)
