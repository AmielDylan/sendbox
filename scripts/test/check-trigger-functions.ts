/**
 * Vérifie les fonctions trigger qui pourraient référencer max_weight_kg
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTriggerFunctions() {
  console.log('\n=== VÉRIFICATION DES FONCTIONS TRIGGER ===\n')

  // Liste des fonctions connues
  const functions = [
    'update_announcement_status',
    'generate_qr_code_for_booking',
    'generate_unique_qr_code',
    'set_booking_qr_code',
    'update_bookings_updated_at',
    'notify_rating_requests',
    'log_audit',
    'update_updated_at_column',
  ]

  console.log('Recherche de la définition des fonctions...\n')

  for (const funcName of functions) {
    // Essayer d'obtenir la définition de la fonction via pg_proc
    const { data, error } = await supabase
      .rpc('sql', {
        query: `
        SELECT
          p.proname as function_name,
          pg_get_functiondef(p.oid) as definition
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname = '${funcName}'
        LIMIT 1;
      `,
      } as any)
      .single()

    if (error) {
      // La fonction rpc 'sql' n'existe peut-être pas, essayons une approche différente
      console.log(`❌ Impossible de vérifier ${funcName}: ${error.message}`)
      continue
    }

    if (data) {
      console.log(`\n📝 Fonction: ${funcName}`)
      const def = (data as any).definition || ''

      // Vérifier si la fonction contient max_weight_kg
      if (def.includes('max_weight_kg')) {
        console.log('⚠️  CONTIENT max_weight_kg!')
        console.log('Extrait:')
        const lines = def.split('\n')
        lines.forEach((line: string, i: number) => {
          if (line.includes('max_weight_kg')) {
            console.log(`  Ligne ${i}: ${line.trim()}`)
          }
        })
      } else if (def.includes('available_kg')) {
        console.log('✅ Utilise available_kg (correct)')
      } else {
        console.log('ℹ️  Ne fait pas référence au poids')
      }
    } else {
      console.log(`ℹ️  ${funcName}: fonction non trouvée`)
    }
  }

  console.log('\n=== FIN ===\n')
}

checkTriggerFunctions().catch(console.error)
