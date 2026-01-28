/**
 * Script pour vérifier le role admin dans la base de données
 * Usage: npx tsx scripts/check-admin-role.ts
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Variables d'environnement manquantes")
  console.error(
    'Besoin de: NEXT_PUBLIC_SUPABASE_URL et (SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_ANON_KEY)'
  )
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, supabaseKey)

async function checkAdminRole() {
  console.log('🔍 Vérification du compte admin@gosendbox.com...\n')

  // Chercher le compte spécifique
  const { data: adminAccount, error: adminError } = await supabase
    .from('profiles')
    .select('id, email, firstname, lastname, role, created_at')
    .eq('email', 'admin@gosendbox.com')
    .maybeSingle()

  if (adminError) {
    console.error('❌ Erreur lors de la recherche:', adminError.message)
  } else if (adminAccount) {
    console.log('✅ Compte trouvé:')
    console.log(`   Email: ${adminAccount.email}`)
    console.log(
      `   Nom: ${adminAccount.firstname || 'N/A'} ${adminAccount.lastname || 'N/A'}`
    )
    console.log(`   Role: ${adminAccount.role}`)
    console.log(`   ID: ${adminAccount.id}`)

    if (adminAccount.role === 'admin') {
      console.log('\n✅ Le role est bien "admin" !\n')
    } else {
      console.log(
        `\n⚠️  PROBLÈME: Le role est "${adminAccount.role}" au lieu de "admin"\n`
      )
      console.log('Pour corriger, exécute cette requête SQL:')
      console.log(
        `UPDATE profiles SET role = 'admin' WHERE email = 'admin@gosendbox.com';\n`
      )
    }
  } else {
    console.log('⚠️  Compte admin@gosendbox.com non trouvé\n')
  }

  // Lister tous les admins
  console.log('🔍 Recherche de tous les comptes admin...\n')
  const { data: allAdmins, error } = await supabase
    .from('profiles')
    .select('id, email, firstname, lastname, role')
    .eq('role', 'admin')

  if (error) {
    console.error('❌ Erreur:', error.message)
    process.exit(1)
  }

  if (!allAdmins || allAdmins.length === 0) {
    console.log('⚠️  Aucun compte admin trouvé dans la base de données\n')
    console.log('Pour créer un admin, exécute cette requête SQL:')
    console.log(
      `UPDATE profiles SET role = 'admin' WHERE email = 'admin@gosendbox.com';\n`
    )
  } else {
    console.log(`✅ ${allAdmins.length} compte(s) admin trouvé(s):\n`)
    allAdmins.forEach(profile => {
      console.log(
        `   - ${profile.firstname || 'N/A'} ${profile.lastname || 'N/A'}`
      )
      console.log(`     Email: ${profile.email}`)
      console.log(`     Role: ${profile.role}`)
      console.log(`     ID: ${profile.id}\n`)
    })
  }
}

checkAdminRole()
