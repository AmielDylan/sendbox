/**
 * Queries pour récupérer les détails d'une annonce
 */

import { createClient } from "@/lib/shared/db/client"

export interface AnnouncementDetail {
  id: string
  traveler_id: string
  departure_country: string
  departure_city: string
  arrival_country: string
  arrival_city: string
  departure_date: string
  available_kg: number
  price_per_kg: number
  description: string | null
  status: string
  created_at: string | null
  updated_at: string | null
  views_count?: number
  traveler_firstname: string | null
  traveler_lastname: string | null
  traveler_avatar_url: string | null
  traveler_rating: number
  traveler_services_count: number
  traveler_member_since: string | null
  traveler_kyc_status: 'pending' | 'approved' | 'rejected' | null
  reserved_weight: number
}

export interface Review {
  id: string
  rater_firstname: string | null
  rater_lastname: string | null
  rater_avatar_url: string | null
  rating: number
  comment: string | null
  created_at: string
}

/**
 * Récupère les détails complets d'une annonce
 * @param announcementId - ID de l'annonce
 * @param supabaseClient - Client Supabase (optionnel, créé automatiquement si non fourni)
 */
export async function getAnnouncementDetail(
  announcementId: string,
  supabaseClient?: any
): Promise<{ data: AnnouncementDetail | null; error: any }> {
  const supabase = supabaseClient || createClient()

  // Récupérer l'annonce avec les infos du voyageur
  // Utiliser la relation explicite pour éviter l'ambiguïté entre traveler_id et user_id
  const { data: announcement, error: announcementError } = await supabase
    .from('announcements')
    .select(
      `
      *,
      profiles!announcements_traveler_id_fkey (
        firstname,
        lastname,
        avatar_url,
        kyc_status,
        created_at
      )
    `
    )
    .eq('id', announcementId)
    .single()

  if (announcementError || !announcement) {
    return { data: null, error: announcementError }
  }

  // Calculer le poids réservé (somme des bookings acceptés)
  const { data: bookings } = await supabase
    .from('bookings')
    .select('kilos_requested, weight_kg')
    .eq('announcement_id', announcementId)
    .in('status', ['accepted', 'in_transit'])

  const reservedWeight =
    bookings?.reduce((sum: number, booking: any) => sum + ((booking.kilos_requested || booking.weight_kg) || 0), 0) || 0

  // Calculer le rating et le nombre de services du voyageur
  const { data: ratings } = await supabase
    .from('ratings')
    .select('rating')
    .eq('rated_user_id', announcement.traveler_id)

  const travelerRating =
    ratings && ratings.length > 0
      ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length
      : 0

  const { count: servicesCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('announcement_id', announcementId)
    .eq('status', 'delivered')

  const profile = announcement.profiles as any
  const announcementData = announcement as any

  return {
    data: {
      id: announcement.id,
      traveler_id: announcement.traveler_id,
      departure_country: announcement.departure_country,
      departure_city: announcement.departure_city,
      arrival_country: announcement.arrival_country,
      arrival_city: announcement.arrival_city,
      departure_date: announcement.departure_date,
      available_kg: announcementData.available_kg || 0,
      price_per_kg: announcement.price_per_kg,
      description: announcement.description,
      status: announcement.status,
      created_at: announcement.created_at,
      updated_at: announcement.updated_at,
      traveler_firstname: profile?.firstname || null,
      traveler_lastname: profile?.lastname || null,
      traveler_avatar_url: profile?.avatar_url || null,
      traveler_rating: travelerRating,
      traveler_services_count: servicesCount || 0,
      traveler_member_since: profile?.created_at || null,
      traveler_kyc_status: profile?.kyc_status || null,
      reserved_weight: reservedWeight,
      views_count: announcementData.views_count || 0,
    },
    error: null,
  }
}

/**
 * Récupère les avis pour un voyageur
 * @param travelerId - ID du voyageur
 * @param limit - Nombre maximum d'avis à récupérer
 * @param supabaseClient - Client Supabase (optionnel, créé automatiquement si non fourni)
 */
export async function getTravelerReviews(
  travelerId: string,
  limit: number = 10,
  supabaseClient?: any
): Promise<{ data: Review[] | null; error: any }> {
  const supabase = supabaseClient || createClient()

  const { data, error } = await supabase
    .from('ratings')
    .select(
      `
      id,
      rating,
      comment,
      created_at,
      rater:rater_id (
        firstname,
        lastname,
        avatar_url
      )
    `
    )
    .eq('rated_user_id', travelerId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    return { data: null, error }
  }

  const reviews: Review[] =
    data?.map((rating: any) => ({
      id: rating.id,
      rater_firstname: rating.rater?.firstname || null,
      rater_lastname: rating.rater?.lastname || null,
      rater_avatar_url: rating.rater?.avatar_url || null,
      rating: rating.rating,
      comment: rating.comment,
      created_at: rating.created_at,
    })) || []

  return { data: reviews, error: null }
}

