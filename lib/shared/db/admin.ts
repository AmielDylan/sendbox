/**
 * Client Supabase avec Service Role (serveur uniquement)
 */

import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import type { Database } from '@/types/database.types'

const noopAuthStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
}

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY manquante pour le client admin')
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: `sendbox-admin-${randomUUID()}`,
      storage: noopAuthStorage,
    },
  })
}
