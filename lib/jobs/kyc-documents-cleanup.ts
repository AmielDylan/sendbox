'use server'

import { createAdminClient } from '@/lib/shared/db/admin'

const MAX_AGE_MS = 72 * 60 * 60 * 1000 // 72h

/**
 * Supprime les fichiers KYC du bucket kyc-documents
 * dont le created_at (metadata Supabase Storage) dépasse 72h.
 */
export async function runKYCDocumentsCleanup(): Promise<{
  success: boolean
  deleted: number
}> {
  try {
    const admin = createAdminClient()
    const cutoff = new Date(Date.now() - MAX_AGE_MS)

    // Lister les dossiers utilisateurs (niveau 1)
    const { data: userFolders, error: foldersErr } = await admin.storage
      .from('kyc-documents')
      .list('', { limit: 1000 })

    if (foldersErr) {
      console.error('[kyc-documents-cleanup] list folders error:', foldersErr)
      return { success: false, deleted: 0 }
    }

    const pathsToDelete: string[] = []

    for (const folder of userFolders ?? []) {
      if (!folder.name) continue

      const { data: files, error: filesErr } = await admin.storage
        .from('kyc-documents')
        .list(folder.name, { limit: 100 })

      if (filesErr) {
        console.error(
          `[kyc-documents-cleanup] list files error for ${folder.name}:`,
          filesErr
        )
        continue
      }

      for (const file of files ?? []) {
        const createdAt = file.created_at ? new Date(file.created_at) : null
        if (createdAt && createdAt < cutoff) {
          pathsToDelete.push(`${folder.name}/${file.name}`)
        }
      }
    }

    if (pathsToDelete.length === 0) {
      return { success: true, deleted: 0 }
    }

    const { error: removeErr } = await admin.storage
      .from('kyc-documents')
      .remove(pathsToDelete)

    if (removeErr) {
      console.error('[kyc-documents-cleanup] remove error:', removeErr)
      return { success: false, deleted: 0 }
    }

    return { success: true, deleted: pathsToDelete.length }
  } catch (err) {
    console.error('[kyc-documents-cleanup] unexpected error:', err)
    return { success: false, deleted: 0 }
  }
}
