import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

export type PublicProfile = {
  id: string
  firstname: string | null
  lastname: string | null
  avatar_url: string | null
  rating: number | null
  completed_services: number | null
  created_at: string | null
  kyc_status: Database['public']['Enums']['kyc_status'] | null
  bio: string | null
}

export async function getPublicProfiles(
  supabase: SupabaseClient<Database>,
  userIds: Array<string | null | undefined>
): Promise<{ data: PublicProfile[]; error: Error | null }> {
  const uniqueIds = Array.from(
    new Set(userIds.filter((id): id is string => Boolean(id)))
  )

  if (uniqueIds.length === 0) {
    return { data: [], error: null }
  }

  const { data, error } = await (supabase.rpc as any)(
    'get_public_profiles',
    {
      p_user_ids: uniqueIds,
    }
  )

  if (error) {
    console.error('Error fetching public profiles:', error)
    return { data: [], error }
  }

  return { data: (data as PublicProfile[]) || [], error: null }
}

export function mapPublicProfilesById(profiles: PublicProfile[]) {
  return profiles.reduce<Record<string, PublicProfile>>((acc, profile) => {
    if (profile?.id) {
      acc[profile.id] = profile
    }
    return acc
  }, {})
}
