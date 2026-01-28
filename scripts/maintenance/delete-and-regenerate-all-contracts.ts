/**
 * Script pour supprimer TOUS les contrats PDF existants
 * Les contrats seront régénérés automatiquement lors du prochain accès
 * Usage: npx tsx scripts/delete-and-regenerate-all-contracts.ts
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function deleteAllContracts() {
  console.log('🔄 Suppression de tous les contrats PDF...')

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // Lister tous les fichiers dans le bucket contracts
  const { data: files, error: listError } = await supabase.storage
    .from('contracts')
    .list('', {
      limit: 1000,
      sortBy: { column: 'name', order: 'asc' },
    })

  if (listError) {
    console.error('❌ Erreur lors du listage des fichiers:', listError)
    process.exit(1)
  }

  if (!files || files.length === 0) {
    console.log('ℹ️  Aucun fichier trouvé dans le bucket contracts')
    process.exit(0)
  }

  console.log(`📁 ${files.length} dossiers trouvés`)

  let totalDeleted = 0

  // Pour chaque dossier (booking), lister et supprimer les contrats
  for (const folder of files) {
    if (!folder.name) continue

    const { data: folderFiles, error: folderListError } = await supabase.storage
      .from('contracts')
      .list(folder.name)

    if (folderListError) {
      console.warn(
        `⚠️  Erreur lors du listage du dossier ${folder.name}:`,
        folderListError
      )
      continue
    }

    if (!folderFiles || folderFiles.length === 0) continue

    // Filtrer uniquement les fichiers contract-*.pdf
    const contractFiles = folderFiles
      .filter(f => f.name.startsWith('contract-') && f.name.endsWith('.pdf'))
      .map(f => `${folder.name}/${f.name}`)

    if (contractFiles.length === 0) continue

    console.log(
      `  📄 Suppression de ${contractFiles.length} contrat(s) dans ${folder.name}`
    )

    const { error: deleteError } = await supabase.storage
      .from('contracts')
      .remove(contractFiles)

    if (deleteError) {
      console.error(`  ❌ Erreur lors de la suppression:`, deleteError)
    } else {
      totalDeleted += contractFiles.length
      console.log(`  ✅ Supprimés: ${contractFiles.join(', ')}`)
    }
  }

  console.log('')
  console.log(`✅ Terminé! ${totalDeleted} contrat(s) supprimé(s)`)
  console.log(
    'ℹ️  Les contrats seront régénérés automatiquement lors du prochain accès'
  )
  console.log('ℹ️  avec les noms de pays complets (France, Bénin, etc.)')

  process.exit(0)
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Erreur: Variables d'environnement manquantes")
  console.log(
    'Assurez-vous que NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont définis'
  )
  process.exit(1)
}

deleteAllContracts()
