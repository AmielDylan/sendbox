/**
 * Script de nettoyage de la base de données Supabase
 * Supprime toutes les données sauf les utilisateurs (profiles)
 *
 * Usage:
 *   npx tsx scripts/clean-database.ts
 *   npx tsx scripts/clean-database.ts --confirm
 *
 * Options:
 *   --confirm        Exécuter le nettoyage sans confirmation interactive
 *   --include-storage Nettoyer aussi les fichiers dans le storage
 *   --dry-run        Afficher ce qui serait supprimé sans rien supprimer
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as readline from 'readline'

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variables d\'environnement manquantes:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Créer le client Supabase avec la clé service_role pour bypass RLS
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Parse des arguments
const args = process.argv.slice(2)
const confirmFlag = args.includes('--confirm')
const includeStorage = args.includes('--include-storage')
const dryRun = args.includes('--dry-run')

interface TableStats {
  tableName: string
  rowCount: number
}

/**
 * Compte le nombre de lignes dans chaque table
 */
async function getTableStats(): Promise<TableStats[]> {
  const tables = ['announcements', 'bookings', 'transactions', 'ratings', 'messages', 'notifications', 'profiles']
  const stats: TableStats[] = []

  for (const table of tables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })

    if (error) {
      console.error(`⚠️ Erreur lors du comptage de ${table}:`, error.message)
      stats.push({ tableName: table, rowCount: 0 })
    } else {
      stats.push({ tableName: table, rowCount: count ?? 0 })
    }
  }

  return stats
}

/**
 * Supprime les données d'une table
 */
async function cleanTable(tableName: string): Promise<{ success: boolean; count: number }> {
  // D'abord, compter les lignes
  const { count: beforeCount, error: countError } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true })

  if (countError) {
    console.error(`❌ Erreur lors du comptage de ${tableName}:`, countError.message)
    return { success: false, count: 0 }
  }

  const rowCount = beforeCount ?? 0

  if (rowCount === 0) {
    console.log(`ℹ️ ${tableName}: déjà vide`)
    return { success: true, count: 0 }
  }

  if (dryRun) {
    console.log(`🧪 [DRY RUN] ${tableName}: ${rowCount} lignes seraient supprimées`)
    return { success: true, count: rowCount }
  }

  // Supprimer toutes les lignes
  // Note: Supabase ne permet pas de DELETE sans WHERE, donc on utilise une condition toujours vraie
  const { error: deleteError } = await supabase.from(tableName).delete().neq('id', '00000000-0000-0000-0000-000000000000')

  if (deleteError) {
    console.error(`❌ Erreur lors de la suppression de ${tableName}:`, deleteError.message)
    return { success: false, count: 0 }
  }

  console.log(`✅ ${tableName}: ${rowCount} lignes supprimées`)
  return { success: true, count: rowCount }
}

/**
 * Nettoie les fichiers du storage
 */
async function cleanStorage(): Promise<void> {
  const buckets = ['kyc-documents', 'signatures', 'contracts', 'package-proofs']

  console.log('\n📦 Nettoyage du storage...')

  for (const bucket of buckets) {
    try {
      // Lister tous les fichiers du bucket
      const { data: files, error: listError } = await supabase.storage.from(bucket).list()

      if (listError) {
        console.error(`⚠️ Erreur lors de la liste des fichiers de ${bucket}:`, listError.message)
        continue
      }

      if (!files || files.length === 0) {
        console.log(`ℹ️ ${bucket}: déjà vide`)
        continue
      }

      if (dryRun) {
        console.log(`🧪 [DRY RUN] ${bucket}: ${files.length} fichiers seraient supprimés`)
        continue
      }

      // Supprimer tous les fichiers
      const filePaths = files.map((file) => file.name)
      const { error: deleteError } = await supabase.storage.from(bucket).remove(filePaths)

      if (deleteError) {
        console.error(`❌ Erreur lors de la suppression des fichiers de ${bucket}:`, deleteError.message)
      } else {
        console.log(`✅ ${bucket}: ${files.length} fichiers supprimés`)
      }
    } catch (err) {
      console.error(`❌ Erreur inattendue pour ${bucket}:`, err)
    }
  }
}

/**
 * Demande confirmation à l'utilisateur
 */
function askConfirmation(): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question('\n⚠️ ATTENTION: Cette action va supprimer toutes les données sauf les utilisateurs.\nÊtes-vous sûr de vouloir continuer? (tapez "OUI" pour confirmer): ', (answer) => {
      rl.close()
      resolve(answer.trim().toUpperCase() === 'OUI')
    })
  })
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🧹 Script de nettoyage de la base de données Supabase\n')

  if (dryRun) {
    console.log('🧪 Mode DRY RUN activé - Aucune suppression ne sera effectuée\n')
  }

  // Afficher les statistiques avant nettoyage
  console.log('📊 État actuel de la base de données:')
  const beforeStats = await getTableStats()
  beforeStats.forEach((stat) => {
    console.log(`   - ${stat.tableName}: ${stat.rowCount} lignes`)
  })

  // Calculer le total (hors profiles)
  const totalToDelete = beforeStats
    .filter((stat) => stat.tableName !== 'profiles')
    .reduce((sum, stat) => sum + stat.rowCount, 0)

  if (totalToDelete === 0) {
    console.log('\n✨ La base de données est déjà propre (aucune donnée à supprimer).')
    return
  }

  console.log(`\n📝 Total de lignes à supprimer: ${totalToDelete}`)
  console.log(`👤 Utilisateurs conservés: ${beforeStats.find((s) => s.tableName === 'profiles')?.rowCount ?? 0}`)

  // Demander confirmation si nécessaire
  if (!confirmFlag && !dryRun) {
    const confirmed = await askConfirmation()
    if (!confirmed) {
      console.log('\n❌ Opération annulée.')
      return
    }
  }

  console.log('\n🚀 Début du nettoyage...\n')

  // Ordre de suppression respectant les dépendances (foreign keys)
  const tablesToClean = ['notifications', 'messages', 'ratings', 'transactions', 'bookings', 'announcements']

  const results = {
    success: 0,
    failed: 0,
    totalDeleted: 0,
  }

  for (const table of tablesToClean) {
    const result = await cleanTable(table)
    if (result.success) {
      results.success++
      results.totalDeleted += result.count
    } else {
      results.failed++
    }
  }

  // Nettoyer le storage si demandé
  if (includeStorage) {
    await cleanStorage()
  }

  // Afficher les statistiques après nettoyage
  console.log('\n' + '='.repeat(70))
  console.log('📊 RÉSUMÉ')
  console.log('='.repeat(70))
  console.log(`✅ Tables nettoyées avec succès: ${results.success}`)
  console.log(`❌ Tables en erreur: ${results.failed}`)
  console.log(`🗑️ Total de lignes supprimées: ${results.totalDeleted}`)

  if (!dryRun) {
    console.log('\n📊 État final de la base de données:')
    const afterStats = await getTableStats()
    afterStats.forEach((stat) => {
      const emoji = stat.tableName === 'profiles' ? '👤' : stat.rowCount === 0 ? '✅' : '⚠️'
      console.log(`   ${emoji} ${stat.tableName}: ${stat.rowCount} lignes`)
    })
  }

  console.log('\n✨ Nettoyage terminé!')

  if (!includeStorage) {
    console.log('\nℹ️ Les fichiers du storage n\'ont pas été supprimés.')
    console.log('   Pour nettoyer aussi le storage, utilisez: --include-storage')
  }
}

main().catch((error) => {
  console.error('❌ Erreur fatale:', error)
  process.exit(1)
})
