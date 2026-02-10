// Supabase Edge Function: cleanup-user-storage
import { serve } from 'std/http/server.ts'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const CLEANUP_SECRET = Deno.env.get('CLEANUP_USER_STORAGE_SECRET')

const buckets = [
  'kyc-documents',
  'signatures',
  'package-photos',
  'deposits',
  'deliveries',
  'avatars',
  'contracts',
  'message-attachments',
  'package-proofs',
]

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null

async function listAll(bucket: string, prefix = ''): Promise<string[]> {
  if (!supabase) return []
  const files: string[] = []
  let offset = 0
  const limit = 1000

  while (true) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(prefix, { limit, offset })

    if (error) {
      console.error(`List error (${bucket}/${prefix}):`, error.message)
      break
    }

    if (!data || data.length === 0) break

    for (const item of data) {
      const path = prefix ? `${prefix}/${item.name}` : item.name
      if (item.id) {
        files.push(path)
      } else {
        const nested = await listAll(bucket, path)
        files.push(...nested)
      }
    }

    if (data.length < limit) break
    offset += limit
  }

  return files
}

serve(async req => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  if (CLEANUP_SECRET) {
    const provided = req.headers.get('x-cleanup-secret')
    if (!provided || provided !== CLEANUP_SECRET) {
      return new Response('Unauthorized', { status: 401 })
    }
  }

  if (!supabase) {
    return new Response('Supabase client unavailable', { status: 500 })
  }

  let payload: { user_id?: string } | null = null
  try {
    payload = await req.json()
  } catch {
    payload = null
  }

  const userId = payload?.user_id?.trim()
  if (!userId) {
    return new Response('Missing user_id', { status: 400 })
  }

  let removedCount = 0
  for (const bucket of buckets) {
    try {
      const files = await listAll(bucket, userId)
      if (!files.length) continue
      const { error } = await supabase.storage.from(bucket).remove(files)
      if (error) {
        console.error(`Remove error (${bucket}):`, error.message)
      } else {
        removedCount += files.length
      }
    } catch (error) {
      console.error(`Cleanup error (${bucket}):`, error)
    }
  }

  return new Response(
    JSON.stringify({ ok: true, user_id: userId, removed: removedCount }),
    { headers: { 'content-type': 'application/json' } }
  )
})
