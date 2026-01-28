/**
 * Supabase test helpers for creating test users and data
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

/**
 * Create a test user with profile
 */
export async function createTestUser(options?: {
  email?: string
  role?: 'sender' | 'traveler' | 'both' | 'admin'
  firstName?: string
  lastName?: string
}) {
  const email = options?.email || `test-${Date.now()}@example.com`
  const password = 'TestPassword123!'

  // Create auth user
  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

  if (authError || !authData.user) {
    throw new Error(`Failed to create test user: ${authError?.message}`)
  }

  // Update profile with role
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({
      role: options?.role || 'sender',
      first_name: options?.firstName || 'Test',
      last_name: options?.lastName || 'User',
    })
    .eq('id', authData.user.id)

  if (profileError) {
    throw new Error(`Failed to update profile: ${profileError.message}`)
  }

  return {
    id: authData.user.id,
    email: authData.user.email!,
    password,
  }
}

/**
 * Create a test admin user
 */
export async function createTestAdmin(options?: {
  email?: string
  firstName?: string
  lastName?: string
}) {
  return createTestUser({ ...options, role: 'admin' })
}

/**
 * Delete a test user
 */
export async function deleteTestUser(userId: string) {
  await supabaseAdmin.auth.admin.deleteUser(userId)
}

/**
 * Get Supabase client for a specific user
 */
export async function getSupabaseClientForUser(userId: string) {
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: `user-${userId}@example.com`,
  })

  if (error || !data) {
    throw new Error('Failed to generate auth link')
  }

  const client = createClient<Database>(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  return client
}

/**
 * Clean up all test data
 */
export async function cleanupTestData() {
  // Delete test users (those with test emails)
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .like('email', 'test-%@example.com')

  if (profiles) {
    for (const profile of profiles) {
      await deleteTestUser(profile.id)
    }
  }
}
