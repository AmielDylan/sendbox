/**
 * Queries Supabase pour les annonces
 */

import { createClient } from "@/lib/shared/db/client"

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

  const { data, error } = await (supabase.rpc as any)('search_announcements', {
    p_departure_country: filters.departureCountry || null,
    p_arrival_country: filters.arrivalCountry || null,
    p_departure_date: filters.departureDate
      ? filters.departureDate.toISOString().split('T')[0]
      : null,
    p_min_kg: filters.minKg || null,
    p_sort_by: filters.sortBy || 'date',
    p_limit: 10,
    p_offset: ((filters.page || 1) - 1) * 10,
  })

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
      ? filters.departureDate.toISOString().split('T')[0]
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
    query = query.eq('status', status)
  }

  const { data, error } = await query

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
    .select(
      `
      *,
      profiles:traveler_id (
        first_name,
        last_name,
        avatar_url,
        kyc_status
      )
    `
    )
    .eq('id', announcementId)
    .single()

  if (error) {
    console.error('Get announcement error:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

