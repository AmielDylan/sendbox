/**
 * Queries Supabase pour les annonces
 */

import { createClient } from "@/lib/shared/db/client"
import { getPublicProfiles } from "@/lib/shared/db/queries/public-profiles"

/**
 * Formate une date en YYYY-MM-DD sans décalage de fuseau horaire
 */
function formatDateLocal(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export interface SearchFilters {
  departureCountry?: string | null
  arrivalCountry?: string | null
  departureDate?: Date | null
  minKg?: number | null
  sortBy?: 'date' | 'price' | 'rating'
  page?: number
}

export interface AnnouncementResult {
  id: string
  traveler_id: string
  origin_country: string
  origin_city: string
  destination_country: string
  destination_city: string
  departure_date: string
  arrival_date: string
  max_weight_kg: number
  price_per_kg: number
  description: string | null
  status: string
  created_at: string
  updated_at: string
  traveler_first_name: string | null
  traveler_last_name: string | null
  traveler_avatar_url: string | null
  traveler_rating: number
  traveler_services_count: number
  match_score: number
}

/**
 * Recherche d'annonces avec filtres (côté client)
 */
export async function searchAnnouncementsClient(filters: SearchFilters) {
  const supabase = createClient()

  const params = {
    p_departure_country: filters.departureCountry || null,
    p_arrival_country: filters.arrivalCountry || null,
    p_departure_date: filters.departureDate
      ? formatDateLocal(filters.departureDate)
      : null,
    p_min_kg: filters.minKg || null,
    p_sort_by: filters.sortBy || 'date',
    p_limit: 10,
    p_offset: ((filters.page || 1) - 1) * 10,
  }

  console.log('searchAnnouncementsClient - params:', params)

  const { data, error } = await (supabase.rpc as any)('search_announcements', params)

  console.log('searchAnnouncementsClient - result:', { data, error, count: data?.length })

  if (error) {
    console.error('Search announcements error:', error)
    return { data: null, error }
  }

  return { data: data as AnnouncementResult[], error: null }
}

/**
 * Compte le nombre total d'annonces correspondant aux filtres
 */
export async function countSearchAnnouncements(filters: SearchFilters) {
  const supabase = createClient()

  const { data, error } = await (supabase.rpc as any)('count_search_announcements', {
    p_departure_country: filters.departureCountry || null,
    p_arrival_country: filters.arrivalCountry || null,
    p_departure_date: filters.departureDate
      ? formatDateLocal(filters.departureDate)
      : null,
    p_min_kg: filters.minKg || null,
  })

  if (error) {
    console.error('Count announcements error:', error)
    return { count: 0, error }
  }

  return { count: data as number, error: null }
}

/**
 * Récupère les annonces d'un utilisateur (côté client)
 */
export async function getUserAnnouncements(
  userId: string,
  status?: 'active' | 'draft' | 'completed' | 'cancelled'
) {
  const supabase = createClient()

  let query = supabase
    .from('announcements')
    .select('*')
    .eq('traveler_id', userId)
    .order('created_at', { ascending: false })

  if (status) {
    // "active" inclut toutes les annonces publiées (active, partially_booked, fully_booked)
    if (status === 'active') {
      query = query.in('status', ['active', 'partially_booked', 'fully_booked'])
    } else {
      query = query.eq('status', status)
    }
  }

  const { data, error } = await query

  console.log('getUserAnnouncements:', { userId, status, data, error })

  if (error) {
    console.error('Get user announcements error:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

/**
 * Récupère une annonce par ID
 */
export async function getAnnouncementById(announcementId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('id', announcementId)
    .single()

  if (error) {
    console.error('Get announcement error:', error)
    return { data: null, error }
  }

  const { data: publicProfiles } = await getPublicProfiles(supabase, [
    data.traveler_id,
  ])
  const profile = publicProfiles?.[0] || null

  return {
    data: {
      ...data,
      profiles: profile,
    },
    error: null,
  }
}
