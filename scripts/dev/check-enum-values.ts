/**
 * Script pour vérifier les valeurs de l'enum announcement_status
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

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
  } catch {}
}

loadEnvFile()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function checkEnum() {
  console.log('🔍 Vérification de l\'enum announcement_status...\n')

  // Tester différentes valeurs de statut
  const testStatuses = ['draft', 'active', 'published', 'partially_booked', 'completed', 'cancelled']
  
  for (const status of testStatuses) {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('id')
        .eq('status', status)
        .limit(1)
      
      if (error) {
        if (error.message.includes('invalid input value')) {
          console.log(`   ❌ "${status}" - INVALIDE dans l'enum`)
        } else {
          console.log(`   ⚠️  "${status}" - Erreur: ${error.message}`)
        }
      } else {
        console.log(`   ✅ "${status}" - VALIDE`)
      }
    } catch (e: any) {
      console.log(`   ❌ "${status}" - Exception: ${e.message}`)
    }
  }

  // Essayer de créer une annonce de test pour voir les valeurs acceptées
  console.log('\n🧪 Test création avec différents statuts:')
  const testStatuses2 = ['draft', 'active', 'published']
  for (const status of testStatuses2) {
    try {
      const { error } = await supabase
        .from('announcements')
        .insert({
          traveler_id: '00000000-0000-0000-0000-000000000000',
          departure_country: 'FR',
          departure_city: 'Test',
          arrival_country: 'BJ',
          arrival_city: 'Test',
          departure_date: new Date().toISOString(),
          arrival_date: new Date().toISOString(),
          available_kg: 10,
          price_per_kg: 10,
          status: status as any,
        })
        .select()
        .single()
      
      if (error) {
        console.log(`   ❌ "${status}": ${error.message}`)
      } else {
        console.log(`   ✅ "${status}" accepté`)
        // Nettoyer
        await supabase.from('announcements').delete().eq('id', (await supabase.from('announcements').select('id').limit(1).single()).data?.id)
      }
    } catch (e: any) {
      console.log(`   ❌ "${status}": ${e.message}`)
    }
  }
}

checkEnum().catch(console.error)









